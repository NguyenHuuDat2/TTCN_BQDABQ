import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export type HoaDonHienThi = {
  soHoaDon: string
  phuongThuc: 'TIEN_MAT' | 'QR'
  tongTien: number
  tienTraLai: number
  tenKhachHang: string
  tienKhachDua: number | null
  chiTiet: {
    tenSanPham: string
    soLuong: number
    donGia: number
  }[]
}

const tienViet = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 2,
})

export default function BienLaiDialog({
  hoaDon,
  onDong,
}: {
  hoaDon: HoaDonHienThi
  onDong: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  return createPortal(
    <dialog
      ref={dialog}
      className="pos-bien-lai border-0 rounded-3 shadow p-0"
      style={{ width: 'min(460px, 94vw)', maxHeight: '90vh' }}
      aria-labelledby="pos-tieu-de-bien-lai"
      onCancel={(event) => {
        event.preventDefault()
        onDong()
      }}
    >
      <style>{`
        .pos-bien-lai::backdrop { background: rgba(15, 23, 42, .45); }
        @media print {
          body > :not(.pos-bien-lai) { display: none !important; }
          body { margin: 0 !important; background: white !important; }
          dialog.pos-bien-lai[open] {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 80mm !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 0 !important;
          }
          .pos-bien-lai::backdrop { background: transparent; }
          .pos-bien-lai .pos-khong-in { display: none !important; }
          .pos-bien-lai article { padding: 3mm !important; }
          .pos-bien-lai tr { break-inside: avoid; }
        }
      `}</style>

      <article className="p-4">
        <p className="text-success fw-semibold text-center mb-1 pos-khong-in">
          Thanh toán thành công
        </p>
        <h2 id="pos-tieu-de-bien-lai" className="h4 text-center mb-3">
          Hóa đơn bán hàng
        </h2>

        <div className="small text-break">Số hóa đơn: {hoaDon.soHoaDon}</div>
        <div className="small">Khách hàng: {hoaDon.tenKhachHang}</div>
        <div className="small">
          Phương thức: {hoaDon.phuongThuc === 'QR' ? 'Chuyển khoản QR' : 'Tiền mặt'}
        </div>

        <table className="table table-sm align-middle mt-3">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="text-center">SL</th>
              <th className="text-end">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {hoaDon.chiTiet.map((dong, index) => (
              <tr key={index}>
                <td>
                  <div>{dong.tenSanPham}</div>
                  <small>{tienViet.format(dong.donGia)}</small>
                </td>
                <td className="text-center">{dong.soLuong}</td>
                <td className="text-end text-nowrap">
                  {tienViet.format(Math.round(dong.donGia * 100) * dong.soLuong / 100)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between fw-bold">
          <span>Tổng thanh toán</span>
          <span>{tienViet.format(hoaDon.tongTien)}</span>
        </div>

        {hoaDon.phuongThuc === 'TIEN_MAT' && (
          <>
            <div className="d-flex justify-content-between mt-1">
              <span>Khách đưa</span>
              <span>{tienViet.format(hoaDon.tienKhachDua ?? 0)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Tiền trả lại</span>
              <span>{tienViet.format(hoaDon.tienTraLai)}</span>
            </div>
          </>
        )}

        <div className="d-flex gap-2 mt-4 pos-khong-in">
          <button
            type="button"
            className="btn btn-outline-secondary flex-fill"
            onClick={onDong}
          >
            Đóng
          </button>
          <button
            type="button"
            className="btn btn-primary flex-fill"
            onClick={() => window.print()}
          >
            In hóa đơn
          </button>
        </div>
      </article>
    </dialog>,
    document.body,
  )
}