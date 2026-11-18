
import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  RefreshCw,
} from 'lucide-react'
import {
  layChiTietDoiSoat,
  layDanhSachDoiSoat,
  xacNhanDoiSoat,
  type DoiSoatChiTiet,
  type PhienThuNgan,
} from './caThuNganApi'

const tienViet = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function hienTien(tien: number | null) {
  return tienViet.format(tien ?? 0)
}

function tenCa(value: string) {
  const ten: Record<string, string> = {
    SANG: 'Ca sáng',
    CHIEU: 'Ca chiều',
    TOI: 'Ca tối',
  }
  return ten[value] ?? value
}

function loiTu(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.'
}

export default function DoiSoatCaPage() {
  const [danhSach, setDanhSach] = useState<PhienThuNgan[]>([])
  const [chiTiet, setChiTiet] = useState<DoiSoatChiTiet | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')

  async function taiDanhSach(signal?: AbortSignal) {
    const duLieu = await layDanhSachDoiSoat(signal)

    if (!signal?.aborted) {
      setDanhSach(duLieu)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    async function khoiTao() {
      try {
        await taiDanhSach(controller.signal)
      } catch (error) {
        if (!controller.signal.aborted) setLoi(loiTu(error))
      } finally {
        if (!controller.signal.aborted) setDangTai(false)
      }
    }

    void khoiTao()
    return () => controller.abort()
  }, [])

  async function lamMoi() {
    setDangTai(true)
    setLoi('')
    setThongBao('')

    try {
      await taiDanhSach()
      setChiTiet(null)
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTai(false)
    }
  }

  async function xemChiTiet(phien: PhienThuNgan) {
    setDangTaiChiTiet(true)
    setLoi('')
    setChiTiet(null)

    try {
      const ketQua = await layChiTietDoiSoat(phien.id)
      setChiTiet(ketQua)
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTaiChiTiet(false)
    }
  }

  async function xacNhan() {
    if (!chiTiet || dangXuLy) return

    const phien = chiTiet.phien

    if (!window.confirm(
      `Xác nhận đã kiểm tra và đối soát phiên #${phien.id}?`
    )) {
      return
    }

    setDangXuLy(true)
    setLoi('')
    setThongBao('')

    try {
      await xacNhanDoiSoat(phien.id)

      setDanhSach((cu) => cu.filter((item) => item.id !== phien.id))
      setChiTiet(null)
      setThongBao(`Đã xác nhận đối soát phiên #${phien.id}.`)
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  if (dangTai) {
    return <div className="p-4 text-secondary">Đang tải danh sách phiên…</div>
  }

  return (
    <section className="w-100 p-3 p-md-4 text-start">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Đối soát ca thu ngân</h1>
          <p className="text-secondary mb-0">
            Kiểm tra và xác nhận kết quả cuối phiên
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          onClick={() => void lamMoi()}
          disabled={dangTai || dangXuLy}
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {loi && (
        <div className="alert alert-danger py-2" role="alert">
          {loi}
        </div>
      )}

      {thongBao && (
        <div className="alert alert-success py-2" role="status">
          {thongBao}
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <div className="bg-white border rounded-3">
            <div className="p-3 border-bottom d-flex justify-content-between">
              <h2 className="h6 fw-bold mb-0">
                <ClipboardCheck size={17} className="me-2" />
                Phiên chờ đối soát
              </h2>
              <span className="badge text-bg-warning">
                {danhSach.length}
              </span>
            </div>

            {danhSach.length === 0 ? (
              <div className="text-center text-secondary p-4">
                Không có phiên nào đang chờ đối soát.
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {danhSach.map((phien) => (
                  <button
                    type="button"
                    key={phien.id}
                    className={`list-group-item list-group-item-action text-start p-3 ${
                      chiTiet?.phien.id === phien.id ? 'active' : ''
                    }`}
                    onClick={() => void xemChiTiet(phien)}
                    disabled={dangTaiChiTiet || dangXuLy}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Phiên #{phien.id}</strong>
                      <Eye size={16} />
                    </div>

                    <div className="small mt-2">
                      {phien.tenThuNgan}
                    </div>

                    <div className={`small ${
                      chiTiet?.phien.id === phien.id
                        ? 'text-white-50' : 'text-secondary'
                    }`}>
                      {phien.tenChiNhanh}
                    </div>

                    <div className="d-flex justify-content-between mt-2 small">
                      <span>{tenCa(phien.loaiCa)}</span>
                      <span className="fw-semibold">
                        {hienTien(phien.tienChenhLech)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="bg-white border rounded-3 p-3 p-md-4">
            {dangTaiChiTiet ? (
              <div className="text-secondary py-4 text-center">
                Đang tải chi tiết phiên…
              </div>
            ) : !chiTiet ? (
              <div className="text-secondary text-center py-5">
                <Eye size={32} className="mb-3" />
                <p className="mb-0">
                  Chọn một phiên bên trái để xem chi tiết đối soát.
                </p>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
                  <div>
                    <span className="badge text-bg-warning mb-2">
                      Chờ đối soát
                    </span>
                    <h2 className="h5 fw-bold mb-1">
                      Phiên thu ngân #{chiTiet.phien.id}
                    </h2>
                    <div className="small text-secondary">
                      {chiTiet.phien.tenChiNhanh}
                    </div>
                  </div>

                  <div className="small text-secondary">
                    {chiTiet.phien.ngayLamViec}
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="small text-secondary">Thu ngân</div>
                    <div className="fw-semibold">
                      {chiTiet.phien.tenThuNgan}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Ca làm việc</div>
                    <div className="fw-semibold">
                      {tenCa(chiTiet.phien.loaiCa)}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Mở phiên</div>
                    <div>{chiTiet.phien.thoiGianMo}</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Đóng phiên</div>
                    <div>{chiTiet.phien.thoiGianDong ?? '—'}</div>
                  </div>
                </div>

                <h3 className="h6 fw-bold mb-3">Đối chiếu tiền</h3>

                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <tbody>
                      <tr>
                        <td>Tiền mặt đầu ca</td>
                        <td className="text-end">
                          {hienTien(chiTiet.phien.tienDauCa)}
                        </td>
                      </tr>
                      <tr>
                        <td>Doanh thu tiền mặt</td>
                        <td className="text-end">
                          {hienTien(chiTiet.phien.doanhThuTienMat)}
                        </td>
                      </tr>
                      <tr>
                        <td>Doanh thu QR</td>
                        <td className="text-end">
                          {hienTien(chiTiet.phien.doanhThuQr)}
                        </td>
                      </tr>
                      <tr>
                        <td>Tiền mặt dự kiến</td>
                        <td className="text-end fw-semibold">
                          {hienTien(chiTiet.phien.tienDuKienCuoiCa)}
                        </td>
                      </tr>
                      <tr>
                        <td>Tiền mặt thực tế</td>
                        <td className="text-end fw-semibold">
                          {hienTien(chiTiet.phien.tienThucTe)}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Chênh lệch</td>
                        <td className={`text-end fw-bold ${
                          (chiTiet.phien.tienChenhLech ?? 0) === 0
                            ? 'text-success' : 'text-danger'
                        }`}>
                          {hienTien(chiTiet.phien.tienChenhLech)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                  <h3 className="h6 fw-bold mb-0">Hóa đơn trong phiên</h3>
                  <span className="badge text-bg-secondary">
                    {chiTiet.giaoDich.length} hóa đơn
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Số hóa đơn</th>
                        <th>Phương thức</th>
                        <th className="text-end">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chiTiet.giaoDich.map((gd) => (
                        <tr key={gd.soHoaDon}>
                          <td>{gd.soHoaDon}</td>
                          <td>
                            {gd.phuongThuc === 'QR'
                              ? 'QR' : gd.phuongThuc === 'TIEN_MAT'
                                ? 'Tiền mặt' : '—'}
                          </td>
                          <td className="text-end text-nowrap">
                            {hienTien(gd.soTien)}
                          </td>
                        </tr>
                      ))}
                      {chiTiet.giaoDich.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center text-secondary">
                            Không có hóa đơn.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={dangXuLy}
                    onClick={() => void xacNhan()}
                  >
                    <CheckCircle2 size={17} className="me-2" />
                    {dangXuLy ? 'Đang xác nhận…' : 'Xác nhận đối soát'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
