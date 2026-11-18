import { useRef, useState, type FormEvent } from 'react'
import { Minus, Plus, ScanBarcode, Trash2 } from 'lucide-react'
import QuetMaVach from '../../components/QuetMaVach'
import {
  traSanPhamTheoMaVach,
  type SanPham,
} from '../san_pham/sanPhamApi'

type DongGioHang = {
  sanPham: SanPham
  soLuong: number
}

const tienViet = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 2,
})

function thanhTien(dong: DongGioHang) {
  return Math.round(dong.sanPham.giaBan * 100) * dong.soLuong / 100
}

export default function BanHangPage() {
  const [maVach, setMaVach] = useState('')
  const [gioHang, setGioHang] = useState<DongGioHang[]>([])
  const [moCamera, setMoCamera] = useState(false)
  const [dangTra, setDangTra] = useState(false)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')

  const oMaVach = useRef<HTMLInputElement>(null)
  const dangXuLy = useRef(false)

  const tongSoLuong = gioHang.reduce((tong, dong) => tong + dong.soLuong, 0)
  const tongTienHang = gioHang.reduce((tong, dong) => tong + thanhTien(dong), 0)

  async function themTheoMaVach(giaTri: string) {
    const ma = giaTri.trim()
    if (!ma || dangXuLy.current) return

    dangXuLy.current = true
    setDangTra(true)
    setMoCamera(false)
    setMaVach(ma)
    setLoi('')
    setThongBao('')

    try {
      const sp = await traSanPhamTheoMaVach(ma)

      if (sp.trangThai !== 'DANG_DUNG') {
        throw new Error(`${sp.tenSanPham} đang ngừng dùng.`)
      }

      setGioHang((ds) => {
        const daCo = ds.some((dong) => dong.sanPham.id === sp.id)

        if (!daCo) {
          return [...ds, { sanPham: sp, soLuong: 1 }]
        }

        return ds.map((dong) =>
          dong.sanPham.id === sp.id
            ? { ...dong, soLuong: dong.soLuong + 1 }
            : dong,
        )
      })

      setMaVach('')
      setThongBao(`Đã thêm 1 ${sp.donViTinh.toLowerCase()} ${sp.tenSanPham}.`)
    } catch (error) {
      setLoi(error instanceof Error ? error.message : 'Không tra được mã vạch.')
    } finally {
      dangXuLy.current = false
      setDangTra(false)
      oMaVach.current?.focus()
      oMaVach.current?.select()
    }
  }

  function nhapMa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void themTheoMaVach(maVach)
  }

  function doiSoLuong(id: number, thayDoi: number) {
    setThongBao('')
    setGioHang((ds) =>
      ds.map((dong) =>
        dong.sanPham.id === id
          ? { ...dong, soLuong: Math.max(1, dong.soLuong + thayDoi) }
          : dong,
      ),
    )
  }

  function xoaDong(id: number) {
    setThongBao('')
    setGioHang((ds) => ds.filter((dong) => dong.sanPham.id !== id))
  }

  return (
    <section className="w-100 p-3 p-md-4 text-start">
      <h1 className="h3 fw-bold mb-4">Bán hàng tại quầy</h1>

      <div className="row g-3">
        <div className="col-12 col-xl-9">
          <form onSubmit={nhapMa} className="card p-3 mb-3">
            <label htmlFor="ban-hang-ma-vach" className="form-label fw-semibold">
              Mã vạch sản phẩm
            </label>

            <div className="row g-2">
              <div className="col-12 col-md">
                <input
                  ref={oMaVach}
                  id="ban-hang-ma-vach"
                  className="form-control"
                  type="text"
                  value={maVach}
                  onChange={(event) => setMaVach(event.target.value)}
                  placeholder="Nhập mã vạch rồi nhấn Enter"
                  autoComplete="off"
                  maxLength={100}
                  readOnly={dangTra}
                />
              </div>

              <div className="col-6 col-md-auto d-grid">
                <button
                  type="button"
                  className="btn btn-outline-primary d-inline-flex align-items-center justify-content-center gap-2"
                  disabled={dangTra}
                  aria-expanded={moCamera}
                  onClick={() => {
                    setLoi('')
                    setMoCamera((mo) => !mo)
                  }}
                >
                  <ScanBarcode size={18} />
                  {moCamera ? 'Tắt camera' : 'Quét mã'}
                </button>
              </div>

              <div className="col-6 col-md-auto d-grid">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={dangTra || !maVach.trim()}
                >
                  {dangTra ? 'Đang tra…' : 'Thêm vào giỏ'}
                </button>
              </div>
            </div>

            {moCamera && (
              <QuetMaVach
                onDong={() => setMoCamera(false)}
                onQuetDuoc={(ma) => void themTheoMaVach(ma)}
              />
            )}
          </form>

          {loi && (
            <p role="alert" className="alert alert-danger py-2">{loi}</p>
          )}

          {thongBao && (
            <p role="status" className="alert alert-success py-2">{thongBao}</p>
          )}

          <div className="table-responsive border rounded-3 bg-white">
            <table className="table align-middle mb-0">
              <thead className="table-light text-nowrap">
                <tr>
                  <th scope="col" className="px-3 py-3">Sản phẩm</th>
                  <th scope="col" className="py-3">Đơn giá</th>
                  <th scope="col" className="py-3">Số lượng</th>
                  <th scope="col" className="py-3 text-end">Thành tiền</th>
                  <th scope="col" className="px-3 py-3">
                    <span className="visually-hidden">Thao tác</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {gioHang.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-4">
                      Quét hoặc nhập mã vạch để thêm sản phẩm đầu tiên.
                    </td>
                  </tr>
                )}

                {gioHang.map((dong) => {
                  const sp = dong.sanPham

                  return (
                    <tr key={sp.id}>
                      <td className="px-3">
                        <div className="fw-semibold">{sp.tenSanPham}</div>
                        <small className="text-secondary">{sp.maSanPham}</small>
                      </td>

                      <td className="text-nowrap">{tienViet.format(sp.giaBan)}</td>

                      <td>
                        <div className="d-inline-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            aria-label={`Giảm số lượng ${sp.tenSanPham}`}
                            disabled={dong.soLuong <= 1}
                            onClick={() => doiSoLuong(sp.id, -1)}
                          >
                            <Minus size={14} />
                          </button>

                          <span>{dong.soLuong}</span>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            aria-label={`Tăng số lượng ${sp.tenSanPham}`}
                            onClick={() => doiSoLuong(sp.id, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      <td className="text-end text-nowrap">
                        {tienViet.format(thanhTien(dong))}
                      </td>

                      <td className="px-3 text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          aria-label={`Xóa ${sp.tenSanPham} khỏi giỏ`}
                          onClick={() => xoaDong(sp.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-12 col-xl-3">
          <aside className="card p-3">
            <h2 className="h5 fw-semibold mb-3">Giỏ hàng</h2>

            <div className="d-flex justify-content-between mb-2">
              <span>Số mặt hàng</span>
              <span>{gioHang.length}</span>
            </div>

            <div className="d-flex justify-content-between">
              <span>Tổng số lượng</span>
              <span>{tongSoLuong}</span>
            </div>

            <hr />

            <div className="d-flex justify-content-between gap-2 fw-bold">
              <span>Tiền hàng</span>
              <span className="text-primary text-nowrap">
                {tienViet.format(tongTienHang)}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}