
import { useEffect, useState, type FormEvent } from 'react'
import { RefreshCw, Search, Plus, Check, Truck, PackageCheck } from 'lucide-react'
import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

const tien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = options?.method && options.method !== 'GET'
    ? await guiYeuCauGhi(url, options)
    : await fetch(url, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...options,
      })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message || data?.thongBao || `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

function loiTu(e: unknown) {
  return e instanceof Error ? e.message : 'Có lỗi xảy ra.'
}

type TonKho = {
  id: number
  idChiNhanh: number
  tenChiNhanh: string
  idSanPham: number
  maSanPham: string
  tenSanPham: string
  soLuong: number
  nguongCanhBao: number | null
  thoiGianCapNhat: string
}

type ChiNhanh = {
  id: number
  tenChiNhanh: string
}

type SanPham = {
  id: number
  maSanPham: string
  tenSanPham: string
}

type Phieu = {
  id: number
  maPhieu: string
  idChiNhanhXuat: number
  tenChiNhanhXuat: string
  idChiNhanhNhan: number
  tenChiNhanhNhan: string
  trangThai: string
  thoiGianTao: string
  ghiChu: string | null
}

type BaoCao = {
  tuNgay: string
  denNgay: string
  tongQuan: {
    doanhThu: number
    soHoaDon: number
  }
  theoChiNhanh: {
    tenChiNhanh: string
    doanhThu: number
    soHoaDon: number
  }[]
  theoCa: {
    ngay: string
    loaiCa: string
    tenChiNhanh: string
    thuNgan: string
    doanhThu: number
    soHoaDon: number
  }[]
}

function ngayHomNay() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TonKhoPage() {
  const [ds, setDs] = useState<TonKho[]>([])
  const [tuKhoa, setTuKhoa] = useState('')
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(true)

  async function taiDuLieu() {
    setDangTai(true)
    setLoi('')
    try {
      setDs(await api('/api/quan-ly/ton-kho'))
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    void taiDuLieu()
  }, [])

  const ketQua = ds.filter(x =>
    `${x.tenChiNhanh} ${x.maSanPham} ${x.tenSanPham}`
      .toLowerCase().includes(tuKhoa.toLowerCase()),
  )

  const tongMatHang = ds.length
  const sapHet = ds.filter(x =>
    x.nguongCanhBao !== null && x.soLuong <= x.nguongCanhBao,
  ).length

  return (
    <section className="container-fluid p-3 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Quản lý tồn kho</h1>
          <p className="text-secondary mb-0">Theo dõi hàng hóa theo từng chi nhánh</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => void taiDuLieu()}>
          <RefreshCw size={16} className="me-2" /> Làm mới
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-secondary">Số dòng tồn kho</div>
            <div className="fs-3 fw-bold">{tongMatHang}</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3">
            <div className="text-secondary">Mặt hàng cần chú ý</div>
            <div className="fs-3 fw-bold text-danger">{sapHet}</div>
          </div>
        </div>
      </div>

      <div className="input-group mb-3" style={{ maxWidth: 520 }}>
        <span className="input-group-text bg-white"><Search size={17} /></span>
        <input
          className="form-control"
          placeholder="Tìm chi nhánh, mã hoặc tên sản phẩm..."
          value={tuKhoa}
          onChange={e => setTuKhoa(e.target.value)}
        />
      </div>

      {loi && <div className="alert alert-danger">{loi}</div>}

      <div className="table-responsive bg-white border rounded-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="px-3">Chi nhánh</th>
              <th>Mã sản phẩm</th>
              <th>Sản phẩm</th>
              <th className="text-end">Tồn kho</th>
              <th className="text-end">Ngưỡng cảnh báo</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {ketQua.map(x => {
              const canhBao = x.nguongCanhBao !== null
                && x.soLuong <= x.nguongCanhBao

              return (
                <tr key={x.id}>
                  <td className="px-3 fw-semibold">{x.tenChiNhanh}</td>
                  <td>{x.maSanPham}</td>
                  <td>{x.tenSanPham}</td>
                  <td className="text-end fw-bold">{x.soLuong}</td>
                  <td className="text-end">{x.nguongCanhBao ?? '—'}</td>
                  <td>
                    <span className={`badge ${canhBao ? 'text-bg-danger' : 'text-bg-success'}`}>
                      {canhBao ? 'Cần nhập hàng' : 'Bình thường'}
                    </span>
                  </td>
                  <td className="small text-secondary">{x.thoiGianCapNhat}</td>
                </tr>
              )
            })}
            {!dangTai && ketQua.length === 0 && (
              <tr><td colSpan={7} className="text-center py-4 text-secondary">
                Không có dữ liệu tồn kho.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const tenTrangThai: Record<string, string> = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Đã từ chối',
  DANG_VAN_CHUYEN: 'Đang vận chuyển',
  DA_NHAN: 'Đã nhận',
}

export function DieuChuyenPage() {
  const [ds, setDs] = useState<Phieu[]>([])
  const [chiNhanh, setChiNhanh] = useState<ChiNhanh[]>([])
  const [sanPham, setSanPham] = useState<SanPham[]>([])
  const [idChiNhanhXuat, setIdChiNhanhXuat] = useState('')
  const [idSanPham, setIdSanPham] = useState('')
  const [soLuong, setSoLuong] = useState('1')
  const [ghiChu, setGhiChu] = useState('')
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [dangXuLy, setDangXuLy] = useState(false)

  async function taiDuLieu() {
    const [phieu, cn, sp] = await Promise.all([
      api<Phieu[]>('/api/quan-ly/dieu-chuyen'),
      api<ChiNhanh[]>('/api/quan-ly/chi-nhanh'),
      api<SanPham[]>('/api/quan-ly/san-pham'),
    ])
    setDs(phieu)
    setChiNhanh(cn)
    setSanPham(sp)
  }

  useEffect(() => {
    taiDuLieu()
      .catch(e => setLoi(loiTu(e)))
      .finally(() => setDangTai(false))
  }, [])

  async function taoPhieu(e: FormEvent) {
    e.preventDefault()
    if (dangXuLy) return

    setDangXuLy(true)
    setLoi('')
    setThongBao('')

    try {
      await api('/api/quan-ly/dieu-chuyen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idChiNhanhXuat: Number(idChiNhanhXuat),
          ghiChu,
          sanPham: [{
            idSanPham: Number(idSanPham),
            soLuong: Number(soLuong),
          }],
        }),
      })

      setThongBao('Đã tạo phiếu điều chuyển và gửi yêu cầu.')
      setGhiChu('')
      await taiDuLieu()
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangXuLy(false)
    }
  }

  async function guiQuyetDinh(id: number, duyet: boolean) {
    const lyDo = duyet ? '' : window.prompt('Nhập lý do từ chối:')
    if (!duyet && !lyDo?.trim()) return

    setDangXuLy(true)
    setLoi('')
    try {
      await api(`/api/quan-ly/dieu-chuyen/${id}/quyet-dinh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duyet, lyDo }),
      })
      setThongBao('Đã cập nhật quyết định điều chuyển.')
      await taiDuLieu()
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangXuLy(false)
    }
  }

  async function xuatHang(id: number) {
    const phuongThuc = window.prompt(
      'Nhập phương thức: NOI_BO hoặc THUE_NGOAI',
      'THUE_NGOAI',
    )
    if (!phuongThuc) return

    const noiBo = phuongThuc.toUpperCase() === 'NOI_BO'
    const tenDonVi = noiBo ? null : window.prompt('Tên đơn vị vận chuyển:')
    const idNhanVien = noiBo
      ? Number(window.prompt('ID nhân viên vận chuyển:'))
      : null
    const maVanDon = window.prompt('Mã vận đơn (nếu có):') || null
    const chiPhi = window.prompt('Chi phí vận chuyển dự kiến (VND):', '0')

    if (!noiBo && !tenDonVi?.trim()) return
    if (noiBo && (!idNhanVien || idNhanVien <= 0)) return
    if (chiPhi === null || !Number.isFinite(Number(chiPhi)) || Number(chiPhi) < 0) return

    setDangXuLy(true)
    setLoi('')
    try {
      await api(`/api/quan-ly/dieu-chuyen/${id}/xuat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phuongThucVanChuyen: phuongThuc.toUpperCase(),
          idNhanVienVanChuyen: idNhanVien,
          tenDonViVanChuyen: tenDonVi,
          maVanDon,
          soTienDuKien: Number(chiPhi),
        }),
      })
      setThongBao('Đã xác nhận xuất hàng và cập nhật tồn kho.')
      await taiDuLieu()
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangXuLy(false)
    }
  }

  async function nhanHang(id: number) {
    if (!window.confirm('Xác nhận đã kiểm tra và nhận đủ hàng?')) return

    setDangXuLy(true)
    setLoi('')
    try {
      await api(`/api/quan-ly/dieu-chuyen/${id}/nhan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xacNhanDayDu: true }),
      })
      setThongBao('Đã nhận hàng và cập nhật tồn kho chi nhánh.')
      await taiDuLieu()
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangXuLy(false)
    }
  }

  async function capNhatChiPhi(id: number) {
    const soTien = window.prompt('Nhập chi phí vận chuyển thực tế (VND):')
    if (soTien === null || !Number.isFinite(Number(soTien)) || Number(soTien) < 0) return

    const daThanhToan = window.confirm('Khoản chi phí này đã thanh toán?')

    setDangXuLy(true)
    try {
      await api(`/api/quan-ly/dieu-chuyen/${id}/chi-phi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soTienThucTe: Number(soTien),
          trangThaiThanhToanPhi: daThanhToan ? 'DA_THANH_TOAN' : 'CHUA_THANH_TOAN',
          ghiChu: '',
        }),
      })
      setThongBao('Đã cập nhật chi phí vận chuyển.')
      await taiDuLieu()
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangXuLy(false)
    }
  }

  return (
    <section className="container-fluid p-3 p-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Điều chuyển hàng hóa</h1>
          <p className="text-secondary mb-0">Tạo, duyệt, xuất và xác nhận nhận hàng</p>
        </div>
        <button className="btn btn-outline-primary" disabled={dangXuLy}
          onClick={() => void taiDuLieu().catch(e => setLoi(loiTu(e)))}>
          <RefreshCw size={16} className="me-2" /> Làm mới
        </button>
      </div>

      <form className="card border-0 shadow-sm p-3 mb-4" onSubmit={taoPhieu}>
        <h2 className="h5 fw-semibold">Tạo yêu cầu điều chuyển</h2>
        <div className="row g-2">
          <div className="col-md-4">
            <label className="form-label">Chi nhánh xuất</label>
            <select className="form-select" required value={idChiNhanhXuat}
              onChange={e => setIdChiNhanhXuat(e.target.value)}>
              <option value="">Chọn chi nhánh</option>
              {chiNhanh.map(c => (
                <option key={c.id} value={c.id}>{c.tenChiNhanh}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Sản phẩm</label>
            <select className="form-select" required value={idSanPham}
              onChange={e => setIdSanPham(e.target.value)}>
              <option value="">Chọn sản phẩm</option>
              {sanPham.map(s => (
                <option key={s.id} value={s.id}>{s.maSanPham} - {s.tenSanPham}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Số lượng</label>
            <input className="form-control" type="number" min="1" required
              value={soLuong} onChange={e => setSoLuong(e.target.value)} />
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-primary w-100" disabled={dangXuLy}>
              <Plus size={16} className="me-1" /> Tạo phiếu
            </button>
          </div>
          <div className="col-12">
            <input className="form-control" placeholder="Ghi chú"
              value={ghiChu} onChange={e => setGhiChu(e.target.value)} />
          </div>
        </div>
      </form>

      {loi && <div className="alert alert-danger">{loi}</div>}
      {thongBao && <div className="alert alert-success">{thongBao}</div>}

      <div className="table-responsive bg-white border rounded-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th className="px-3">Mã phiếu</th>
              <th>Chi nhánh xuất</th>
              <th>Chi nhánh nhận</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ds.map(p => (
              <tr key={p.id}>
                <td className="px-3 fw-semibold">{p.maPhieu}</td>
                <td>{p.tenChiNhanhXuat}</td>
                <td>{p.tenChiNhanhNhan}</td>
                <td>{p.thoiGianTao}</td>
                <td>
                  <span className={`badge ${
                    p.trangThai === 'DA_NHAN' ? 'text-bg-success'
                    : p.trangThai === 'TU_CHOI' ? 'text-bg-danger'
                    : 'text-bg-primary'
                  }`}>
                    {tenTrangThai[p.trangThai] ?? p.trangThai}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    {p.trangThai === 'CHO_DUYET' && <>
                      <button className="btn btn-sm btn-success" disabled={dangXuLy}
                        onClick={() => void guiQuyetDinh(p.id, true)}>
                        <Check size={14} /> Duyệt
                      </button>
                      <button className="btn btn-sm btn-outline-danger" disabled={dangXuLy}
                        onClick={() => void guiQuyetDinh(p.id, false)}>
                        Từ chối
                      </button>
                    </>}

                    {p.trangThai === 'DA_DUYET' && (
                      <button className="btn btn-sm btn-primary" disabled={dangXuLy}
                        onClick={() => void xuatHang(p.id)}>
                        <Truck size={14} /> Xuất hàng
                      </button>
                    )}

                    {p.trangThai === 'DANG_VAN_CHUYEN' && (
                      <button className="btn btn-sm btn-success" disabled={dangXuLy}
                        onClick={() => void nhanHang(p.id)}>
                        <PackageCheck size={14} /> Xác nhận nhận
                      </button>
                    )}

                    {p.trangThai === 'DA_NHAN' && (
                      <button className="btn btn-sm btn-outline-primary" disabled={dangXuLy}
                        onClick={() => void capNhatChiPhi(p.id)}>
                        Cập nhật chi phí
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!dangTai && ds.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-secondary">
                Chưa có phiếu điều chuyển.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function BaoCaoPage() {
  const [tuNgay, setTuNgay] = useState(ngayHomNay())
  const [denNgay, setDenNgay] = useState(ngayHomNay())
  const [data, setData] = useState<BaoCao | null>(null)
  const [loi, setLoi] = useState('')
  const [dangTai, setDangTai] = useState(false)

  async function taiBaoCao(e?: FormEvent) {
    e?.preventDefault()
    setDangTai(true)
    setLoi('')

    try {
      const query = new URLSearchParams({ tuNgay, denNgay })
      setData(await api(`/api/quan-ly/bao-cao?${query}`))
    } catch (e) {
      setLoi(loiTu(e))
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    void taiBaoCao()
  }, [])

  return (
    <section className="container-fluid p-3 p-lg-4">
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">Dashboard báo cáo doanh số</h1>
        <p className="text-secondary mb-0">Tổng hợp doanh thu theo chi nhánh và ca làm việc</p>
      </div>

      <form className="row g-2 align-items-end mb-4" onSubmit={taiBaoCao}>
        <div className="col-sm-4 col-md-3">
          <label className="form-label">Từ ngày</label>
          <input type="date" className="form-control" value={tuNgay}
            onChange={e => setTuNgay(e.target.value)} required />
        </div>
        <div className="col-sm-4 col-md-3">
          <label className="form-label">Đến ngày</label>
          <input type="date" className="form-control" value={denNgay}
            onChange={e => setDenNgay(e.target.value)} required />
        </div>
        <div className="col-sm-4 col-md-2">
          <button className="btn btn-primary w-100" disabled={dangTai}>
            <RefreshCw size={16} className="me-1" />
            {dangTai ? 'Đang tải...' : 'Thống kê'}
          </button>
        </div>
      </form>

      {loi && <div className="alert alert-danger">{loi}</div>}

      {data && <>
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3">
              <div className="text-secondary">Tổng doanh thu</div>
              <div className="fs-3 fw-bold text-primary">
                {tien.format(data.tongQuan.doanhThu)}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-3">
              <div className="text-secondary">Số hóa đơn thành công</div>
              <div className="fs-3 fw-bold">{data.tongQuan.soHoaDon}</div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm p-3 mb-4">
          <h2 className="h5 fw-semibold mb-3">Doanh thu theo chi nhánh</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead><tr>
                <th>Chi nhánh</th><th className="text-end">Số hóa đơn</th>
                <th className="text-end">Doanh thu</th>
              </tr></thead>
              <tbody>
                {data.theoChiNhanh.map((x, i) => (
                  <tr key={i}>
                    <td>{x.tenChiNhanh}</td>
                    <td className="text-end">{x.soHoaDon}</td>
                    <td className="text-end fw-semibold">{tien.format(x.doanhThu)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card border-0 shadow-sm p-3">
          <h2 className="h5 fw-semibold mb-3">Doanh thu theo ca và thu ngân</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead><tr>
                <th>Ngày</th><th>Ca</th><th>Chi nhánh</th>
                <th>Thu ngân</th><th className="text-end">Hóa đơn</th>
                <th className="text-end">Doanh thu</th>
              </tr></thead>
              <tbody>
                {data.theoCa.map((x, i) => (
                  <tr key={i}>
                    <td>{x.ngay}</td>
                    <td>{x.loaiCa}</td>
                    <td>{x.tenChiNhanh}</td>
                    <td>{x.thuNgan}</td>
                    <td className="text-end">{x.soHoaDon}</td>
                    <td className="text-end fw-semibold">{tien.format(x.doanhThu)}</td>
                  </tr>
                ))}
                {data.theoCa.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-secondary">
                    Không có giao dịch trong khoảng thời gian này.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>}
    </section>
  )
}
