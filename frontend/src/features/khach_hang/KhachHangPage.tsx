import { useEffect, useState, type FormEvent } from 'react'
import { History, Lock, LockOpen, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react'
import {
  capNhatKhachHang,
  capNhatTrangThaiKhachHang,
  layDanhSachKhachHang,
  layLichSuDiem,
  taoKhachHang,
  type KhachHang,
  type LichSuDiem,
} from './khachHangApi'

type CuaSo =
  | { kieu: 'them' }
  | { kieu: 'sua'; khachHang: KhachHang }

type LichSuDangMo = {
  khachHang: KhachHang
  danhSach: LichSuDiem[]
}

function loiTu(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi khi xử lý dữ liệu.'
}

function hienDiem(value: number) {
  return value.toLocaleString('vi-VN')
}

function moTaLichSu(ghiChu: string) {
  const laySo = (khoa: string) => {
    const match = ghiChu.match(new RegExp(`(?:^|;)${khoa}=(\\d+)(?:;|$)`))
    return match ? Number(match[1]) : 0
  }
  const suDung = laySo('SD')
  const duocCong = laySo('DC')
  const giam = laySo('GD')
  const phan = []
  if (suDung > 0) phan.push(`Sử dụng ${hienDiem(suDung)} điểm`)
  if (duocCong > 0) phan.push(`Tích lũy ${hienDiem(duocCong)} điểm`)
  if (giam > 0) phan.push(`Giảm ${Number(giam).toLocaleString('vi-VN')} đ`)
  return phan.join(' · ') || ghiChu || 'Điều chỉnh điểm thành viên'
}

export default function KhachHangPage() {
  const [danhSach, setDanhSach] = useState<KhachHang[]>([])
  const [tuKhoa, setTuKhoa] = useState('')
  const [tuKhoaDaTim, setTuKhoaDaTim] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')
  const [cuaSo, setCuaSo] = useState<CuaSo | null>(null)
  const [lichSu, setLichSu] = useState<LichSuDangMo | null>(null)
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false)
  const [form, setForm] = useState({ hoTen: '', soDienThoai: '' })

  async function taiDanhSach(tuKhoaTim = tuKhoaDaTim, signal?: AbortSignal) {
    const ds = await layDanhSachKhachHang(tuKhoaTim, signal)
    if (!signal?.aborted) setDanhSach(ds)
  }

  useEffect(() => {
    const controller = new AbortController()
    async function khoiTao() {
      try {
        await taiDanhSach('', controller.signal)
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
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTai(false)
    }
  }

  async function timKiem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDangTai(true)
    setLoi('')
    setTuKhoaDaTim(tuKhoa.trim())
    try {
      await taiDanhSach(tuKhoa.trim())
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTai(false)
    }
  }

  function moThem() {
    setForm({ hoTen: '', soDienThoai: '' })
    setCuaSo({ kieu: 'them' })
    setLoi('')
  }

  function moSua(khachHang: KhachHang) {
    setForm({ hoTen: khachHang.hoTen, soDienThoai: khachHang.soDienThoai })
    setCuaSo({ kieu: 'sua', khachHang })
    setLoi('')
  }

  async function luuKhachHang(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cuaSo || dangXuLy) return
    setDangXuLy(true)
    setLoi('')
    setThongBao('')
    try {
      if (cuaSo.kieu === 'them') {
        await taoKhachHang(form)
        setThongBao('Đã tạo khách hàng thành viên.')
      } else {
        await capNhatKhachHang(cuaSo.khachHang.id, form)
        setThongBao('Đã cập nhật thông tin khách hàng.')
      }
      setCuaSo(null)
      await taiDanhSach()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  async function doiTrangThai(khachHang: KhachHang) {
    const trangThaiMoi = khachHang.trangThai === 'HOAT_DONG' ? 'BI_KHOA' : 'HOAT_DONG'
    const hanhDong = trangThaiMoi === 'BI_KHOA' ? 'khóa' : 'mở khóa'
    if (!window.confirm(`Bạn muốn ${hanhDong} khách hàng ${khachHang.hoTen}?`)) return
    setDangXuLy(true)
    setLoi('')
    setThongBao('')
    try {
      await capNhatTrangThaiKhachHang(khachHang.id, trangThaiMoi)
      setThongBao(`Đã ${hanhDong} khách hàng ${khachHang.hoTen}.`)
      await taiDanhSach()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  async function xemLichSu(khachHang: KhachHang) {
    setDangTaiLichSu(true)
    setLoi('')
    try {
      const ds = await layLichSuDiem(khachHang.id)
      setLichSu({ khachHang, danhSach: ds })
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTaiLichSu(false)
    }
  }

  return (
    <section className="container-fluid p-3 p-lg-4 text-start">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Quản lý khách hàng</h1>
          <p className="text-secondary mb-0">Tra cứu thành viên bằng số điện thoại và theo dõi điểm tích lũy.</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => void lamMoi()} disabled={dangTai || dangXuLy}>
            <RefreshCw size={16} className="me-2" />Làm mới
          </button>
          <button type="button" className="btn btn-primary" onClick={moThem} disabled={dangXuLy}>
            <Plus size={16} className="me-2" />Thêm khách hàng
          </button>
        </div>
      </div>

      {loi && <div className="alert alert-danger py-2" role="alert">{loi}</div>}
      {thongBao && <div className="alert alert-success py-2" role="status">{thongBao}</div>}

      <div className="card border-0 shadow-sm rounded-3 p-3 mb-3">
        <form className="row g-2" onSubmit={timKiem}>
          <div className="col-12 col-md">
            <div className="input-group">
              <span className="input-group-text bg-white"><Search size={16} /></span>
              <input className="form-control" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm theo tên hoặc số điện thoại" />
            </div>
          </div>
          <div className="col-12 col-md-auto d-grid">
            <button className="btn btn-outline-primary" disabled={dangTai}><Search size={16} className="me-2" />Tìm kiếm</button>
          </div>
        </form>
      </div>

      <div className="card border-0 shadow-sm rounded-3 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-semibold mb-0">Danh sách thành viên</h2>
          <span className="badge text-bg-primary">{danhSach.length} khách hàng</span>
        </div>
        {dangTai ? (
          <p className="text-secondary mb-0">Đang tải danh sách khách hàng…</p>
        ) : danhSach.length === 0 ? (
          <div className="text-center text-secondary py-5">Không tìm thấy khách hàng phù hợp.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th className="text-end">Điểm hiện có</th>
                  <th>Ngày đăng ký</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {danhSach.map((kh) => (
                  <tr key={kh.id}>
                    <td className="fw-semibold">{kh.hoTen}</td>
                    <td>{kh.soDienThoai}</td>
                    <td className="text-end fw-semibold text-primary">{hienDiem(kh.diemHienCo)}</td>
                    <td>{kh.ngayDangKy}</td>
                    <td>
                      <span className={`badge ${kh.trangThai === 'HOAT_DONG' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                        {kh.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" title="Lịch sử điểm" onClick={() => void xemLichSu(kh)} disabled={dangTaiLichSu}>
                          <History size={15} />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-primary" title="Sửa" onClick={() => moSua(kh)} disabled={dangXuLy}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" title={kh.trangThai === 'HOAT_DONG' ? 'Khóa khách hàng' : 'Mở khóa khách hàng'} onClick={() => void doiTrangThai(kh)} disabled={dangXuLy}>
                          {kh.trangThai === 'HOAT_DONG' ? <Lock size={15} /> : <LockOpen size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cuaSo && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="bg-white rounded-3 shadow w-100" style={{ maxWidth: 480 }} role="dialog" aria-modal="true" aria-labelledby="khach-hang-tieu-de">
            <div className="d-flex justify-content-between align-items-center border-bottom p-3">
              <h2 id="khach-hang-tieu-de" className="h5 fw-semibold mb-0">{cuaSo.kieu === 'them' ? 'Thêm khách hàng' : 'Cập nhật khách hàng'}</h2>
              <button type="button" className="btn btn-sm btn-light" onClick={() => setCuaSo(null)} disabled={dangXuLy}><X size={18} /></button>
            </div>
            <form className="p-3" onSubmit={luuKhachHang}>
              <label className="form-label" htmlFor="khach-hang-ho-ten">Họ tên</label>
              <input id="khach-hang-ho-ten" className="form-control mb-3" maxLength={255} required value={form.hoTen} onChange={(e) => setForm((cu) => ({ ...cu, hoTen: e.target.value }))} />
              <label className="form-label" htmlFor="khach-hang-sdt">Số điện thoại</label>
              <input id="khach-hang-sdt" className="form-control" type="tel" maxLength={20} required value={form.soDienThoai} onChange={(e) => setForm((cu) => ({ ...cu, soDienThoai: e.target.value }))} />
              <div className="small text-secondary mt-2">Số điện thoại là mã tra cứu thành viên và không được trùng.</div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCuaSo(null)} disabled={dangXuLy}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={dangXuLy}>{dangXuLy ? 'Đang lưu…' : 'Lưu khách hàng'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lichSu && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1061 }}>
          <div className="bg-white rounded-3 shadow w-100" style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'auto' }} role="dialog" aria-modal="true" aria-labelledby="lich-su-diem-tieu-de">
            <div className="d-flex justify-content-between align-items-center border-bottom p-3">
              <div>
                <h2 id="lich-su-diem-tieu-de" className="h5 fw-semibold mb-1">Lịch sử điểm thành viên</h2>
                <div className="small text-secondary">{lichSu.khachHang.hoTen} · {lichSu.khachHang.soDienThoai}</div>
              </div>
              <button type="button" className="btn btn-sm btn-light" onClick={() => setLichSu(null)}><X size={18} /></button>
            </div>
            <div className="p-3">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center">
                <span>Điểm hiện có</span>
                <strong className="text-primary fs-5">{hienDiem(lichSu.khachHang.diemHienCo)} điểm</strong>
              </div>
              {lichSu.danhSach.length === 0 ? (
                <div className="text-center text-secondary py-4">Chưa có lịch sử tích hoặc sử dụng điểm.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead className="table-light"><tr><th>Thời gian</th><th>Hóa đơn</th><th>Điểm thay đổi</th><th>Chi tiết</th></tr></thead>
                    <tbody>
                      {lichSu.danhSach.map((item, index) => (
                        <tr key={`${item.soHoaDon}-${index}`}>
                          <td>{item.thoiGian}</td>
                          <td>{item.soHoaDon}</td>
                          <td className={item.soDiemThayDoi >= 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                            {item.soDiemThayDoi > 0 ? '+' : ''}{hienDiem(item.soDiemThayDoi)}
                          </td>
                          <td className="small">{moTaLichSu(item.ghiChu)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
