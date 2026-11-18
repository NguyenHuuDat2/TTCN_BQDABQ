
import { useEffect, useState, type FormEvent } from 'react'
import {
  Clock3,
  Lock,
  LockOpen,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import {
  dongPhien,
  layDanhSachDoiSoat,
  layPhanCongCuaToi,
  layPhienHienTai,
  moPhien,
  type PhanCongCa,
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

function loiTu(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.'
}

function tenCa(value: string) {
  const ten: Record<string, string> = {
    SANG: 'Ca sáng',
    CHIEU: 'Ca chiều',
    TOI: 'Ca tối',
  }
  return ten[value] ?? value
}

export default function CaThuNganPage() {
  const [phanCong, setPhanCong] = useState<PhanCongCa[]>([])
  const [phien, setPhien] = useState<PhienThuNgan | null>(null)
  const [phienDaDong, setPhienDaDong] = useState<PhienThuNgan | null>(null)

  const [idPhanCongCa, setIdPhanCongCa] = useState('')
  const [tienDauCa, setTienDauCa] = useState('')
  const [tienThucTe, setTienThucTe] = useState('')

  const [dangTai, setDangTai] = useState(true)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')

  async function taiDuLieu(signal?: AbortSignal) {
    const [phienHienTai, dsPhanCong] = await Promise.all([
      layPhienHienTai(signal),
      layPhanCongCuaToi(signal),
    ])

    if (signal?.aborted) return

    setPhien(phienHienTai)
    setPhanCong(dsPhanCong)

    if (dsPhanCong.length > 0) {
      setIdPhanCongCa(String(dsPhanCong[0].idPhanCongCa))
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    async function khoiTao() {
      try {
        await taiDuLieu(controller.signal)
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
    setLoi('')
    setThongBao('')
    setDangTai(true)

    try {
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTai(false)
    }
  }

  async function xuLyMoPhien(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (dangXuLy || !idPhanCongCa) return

    const tien = Number(tienDauCa)

    if (!Number.isFinite(tien) || tien < 0) {
      setLoi('Vui lòng nhập số tiền đầu ca hợp lệ.')
      return
    }

    setDangXuLy(true)
    setLoi('')
    setThongBao('')

    try {
      const ketQua = await moPhien(Number(idPhanCongCa), tien)
      setPhien(ketQua)
      setPhienDaDong(null)
      setTienDauCa('')
      setThongBao('Mở phiên thu ngân thành công.')
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  async function xuLyDongPhien(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (dangXuLy || !phien) return

    const tien = Number(tienThucTe)

    if (!Number.isFinite(tien) || tien < 0) {
      setLoi('Vui lòng nhập số tiền kiểm đếm hợp lệ.')
      return
    }

    if (!window.confirm('Bạn chắc chắn muốn đóng phiên thu ngân này?')) {
      return
    }

    setDangXuLy(true)
    setLoi('')
    setThongBao('')

    try {
      const ketQua = await dongPhien(tien)
      setPhien(null)
      setPhienDaDong(ketQua)
      setTienThucTe('')
      setThongBao('Đóng phiên thành công. Phiên đang chờ cửa hàng trưởng đối soát.')
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  if (dangTai) {
    return <div className="p-4 text-secondary">Đang tải thông tin ca thu ngân…</div>
  }

  return (
    <section className="w-100 p-3 p-md-4 text-start">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Ca thu ngân</h1>
          <p className="text-secondary mb-0">
            Quản lý phiên bán hàng và tiền mặt tại quầy
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          disabled={dangXuLy}
          onClick={() => void lamMoi()}
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

      {phien ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
              <div>
                <span className="badge text-bg-success mb-2">
                  <LockOpen size={13} className="me-1" />
                  Đang mở
                </span>
                <h2 className="h5 fw-bold mb-1">Phiên thu ngân #{phien.id}</h2>
                <div className="small text-secondary">
                  {tenCa(phien.loaiCa)} · {phien.ngayLamViec}
                </div>
              </div>
              <div className="text-secondary small">
                <Clock3 size={15} className="me-1" />
                {phien.thoiGianMo}
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <div className="small text-secondary">Tiền đầu ca</div>
                  <div className="h5 fw-bold mt-2 mb-0">
                    {hienTien(phien.tienDauCa)}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <div className="small text-secondary">Doanh thu tiền mặt</div>
                  <div className="h5 fw-bold mt-2 mb-0">
                    {hienTien(phien.doanhThuTienMat)}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="border rounded-3 p-3 h-100">
                  <div className="small text-secondary">Doanh thu QR</div>
                  <div className="h5 fw-bold mt-2 mb-0">
                    {hienTien(phien.doanhThuQr)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-light rounded-3 p-3 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Số hóa đơn đã thanh toán</span>
                <span className="fw-bold">{phien.soHoaDon}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <span className="fw-semibold">Tiền mặt dự kiến cuối ca</span>
                <span className="h5 fw-bold text-primary mb-0">
                  {hienTien(phien.tienDuKienCuoiCa)}
                </span>
              </div>
            </div>

            <form onSubmit={(event) => void xuLyDongPhien(event)}>
              <h3 className="h6 fw-bold mb-3">
                <Wallet size={17} className="me-2" />
                Đóng phiên và kiểm đếm tiền mặt
              </h3>

              <label htmlFor="tien-thuc-te" className="form-label">
                Số tiền mặt thực tế tại quầy
              </label>

              <div className="input-group mb-3">
                <input
                  id="tien-thuc-te"
                  type="number"
                  className="form-control"
                  min="0"
                  step="0.01"
                  value={tienThucTe}
                  onChange={(event) => setTienThucTe(event.target.value)}
                  placeholder="Nhập số tiền đã kiểm đếm"
                  required
                  disabled={dangXuLy}
                />
                <span className="input-group-text">VNĐ</span>
              </div>

              <button
                type="submit"
                className="btn btn-danger"
                disabled={dangXuLy}
              >
                <Lock size={16} className="me-2" />
                {dangXuLy ? 'Đang xử lý…' : 'Xác nhận đóng phiên'}
              </button>
            </form>
          </div>
        </div>
      ) : phienDaDong ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <span className="badge text-bg-warning mb-3">
              Chờ đối soát
            </span>
            <h2 className="h5 fw-bold">
              Phiên #{phienDaDong.id} đã đóng
            </h2>
            <p className="text-secondary">
              Phiên thu ngân đã được chuyển cho cửa hàng trưởng kiểm tra.
            </p>
            <BangKetQua phien={phienDaDong} />
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="mb-4">
              <span className="badge text-bg-secondary mb-2">
                Chưa mở phiên
              </span>
              <h2 className="h5 fw-bold">Mở phiên thu ngân</h2>
              <p className="small text-secondary mb-0">
                Chọn ca được phân công và kiểm đếm tiền mặt đầu ca.
              </p>
            </div>

            {phanCong.length === 0 ? (
              <div className="alert alert-warning mb-0">
                Hôm nay bạn chưa có ca thu ngân được phân công,
                hoặc các ca được phân công đã được sử dụng.
                Vui lòng liên hệ cửa hàng trưởng.
              </div>
            ) : (
              <form onSubmit={(event) => void xuLyMoPhien(event)}>
                <div className="mb-3">
                  <label htmlFor="phan-cong-ca" className="form-label">
                    Ca làm việc
                  </label>
                  <select
                    id="phan-cong-ca"
                    className="form-select"
                    value={idPhanCongCa}
                    onChange={(event) => setIdPhanCongCa(event.target.value)}
                    required
                    disabled={dangXuLy}
                  >
                    {phanCong.map((pc) => (
                      <option
                        key={pc.idPhanCongCa}
                        value={pc.idPhanCongCa}
                      >
                        {tenCa(pc.loaiCa)} ({pc.gioBatDau} - {pc.gioKetThuc})
                        {' · '}{pc.tenChiNhanh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="tien-dau-ca" className="form-label">
                    Tiền mặt đầu ca
                  </label>
                  <div className="input-group">
                    <input
                      id="tien-dau-ca"
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={tienDauCa}
                      onChange={(event) => setTienDauCa(event.target.value)}
                      placeholder="Nhập số tiền mặt ban đầu"
                      required
                      disabled={dangXuLy}
                    />
                    <span className="input-group-text">VNĐ</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={dangXuLy || !idPhanCongCa}
                >
                  <LockOpen size={16} className="me-2" />
                  {dangXuLy ? 'Đang mở phiên…' : 'Xác nhận mở phiên'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function BangKetQua({ phien }: { phien: PhienThuNgan }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm align-middle">
        <tbody>
          <tr>
            <td>Tiền đầu ca</td>
            <td className="text-end">{hienTien(phien.tienDauCa)}</td>
          </tr>
          <tr>
            <td>Doanh thu tiền mặt</td>
            <td className="text-end">{hienTien(phien.doanhThuTienMat)}</td>
          </tr>
          <tr>
            <td>Doanh thu QR</td>
            <td className="text-end">{hienTien(phien.doanhThuQr)}</td>
          </tr>
          <tr>
            <td>Tiền dự kiến</td>
            <td className="text-end fw-semibold">
              {hienTien(phien.tienDuKienCuoiCa)}
            </td>
          </tr>
          <tr>
            <td>Tiền thực tế</td>
            <td className="text-end">{hienTien(phien.tienThucTe)}</td>
          </tr>
          <tr>
            <td>Chênh lệch</td>
            <td className={`text-end fw-bold ${
              (phien.tienChenhLech ?? 0) === 0
                ? 'text-success' : 'text-danger'
            }`}>
              {hienTien(phien.tienChenhLech)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
