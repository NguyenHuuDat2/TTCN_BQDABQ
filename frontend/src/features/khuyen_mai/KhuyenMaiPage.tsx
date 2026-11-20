import { useEffect, useState, type FormEvent } from 'react'
import { Megaphone, Pencil, Plus, RefreshCw, Send, Square, X } from 'lucide-react'
import {
  capNhatKhuyenMai,
  congBoKhuyenMai,
  layChiNhanhKhuyenMai,
  layDanhSachKhuyenMai,
  ngungKhuyenMai,
  taoKhuyenMai,
  type ChiNhanhLuaChon,
  type DuLieuKhuyenMai,
  type KhuyenMai,
} from './khuyenMaiApi'

type FormKhuyenMai = {
  tenChuongTrinh: string
  loaiGiamGia: 'PHAN_TRAM' | 'SO_TIEN'
  giaTriGiam: string
  hoaDonToiThieu: string
  giamToiDa: string
  thoiGianBatDau: string
  thoiGianKetThuc: string
  idChiNhanh: number[]
}

const tienViet = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function loiTu(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi khi xử lý dữ liệu.'
}

function giaTriDateTime(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function taoFormMoi(): FormKhuyenMai {
  const batDau = new Date()
  const ketThuc = new Date(batDau.getTime() + 24 * 60 * 60 * 1000)
  return {
    tenChuongTrinh: '',
    loaiGiamGia: 'PHAN_TRAM',
    giaTriGiam: '10',
    hoaDonToiThieu: '',
    giamToiDa: '',
    thoiGianBatDau: giaTriDateTime(batDau),
    thoiGianKetThuc: giaTriDateTime(ketThuc),
    idChiNhanh: [],
  }
}

function hienTrangThai(km: KhuyenMai) {
  if (km.trangThai === 'NGUNG') return 'Đã ngừng'
  if (km.trangThai === 'BAN_NHAP') return 'Bản nháp'
  if (new Date(km.thoiGianKetThuc).getTime() < Date.now()) return 'Đã kết thúc'
  if (new Date(km.thoiGianBatDau).getTime() > Date.now()) return 'Chờ đến ngày'
  return 'Đang áp dụng'
}

function mauTrangThai(km: KhuyenMai) {
  if (km.trangThai === 'NGUNG') return 'text-bg-secondary'
  if (km.trangThai === 'BAN_NHAP') return 'text-bg-warning'
  if (new Date(km.thoiGianKetThuc).getTime() < Date.now()) return 'text-bg-secondary'
  if (new Date(km.thoiGianBatDau).getTime() > Date.now()) return 'text-bg-info'
  return 'text-bg-success'
}

function hienThoiGian(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function KhuyenMaiPage() {
  const [danhSach, setDanhSach] = useState<KhuyenMai[]>([])
  const [chiNhanh, setChiNhanh] = useState<ChiNhanhLuaChon[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [dangXuLy, setDangXuLy] = useState(false)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')
  const [cuaSo, setCuaSo] = useState<KhuyenMai | 'them' | null>(null)
  const [form, setForm] = useState<FormKhuyenMai>(taoFormMoi)

  async function taiDuLieu(signal?: AbortSignal) {
    const [dsKhuyenMai, dsChiNhanh] = await Promise.all([
      layDanhSachKhuyenMai(signal),
      layChiNhanhKhuyenMai(signal),
    ])
    if (!signal?.aborted) {
      setDanhSach(dsKhuyenMai)
      setChiNhanh(dsChiNhanh)
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
    setDangTai(true)
    setLoi('')
    setThongBao('')
    try {
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTai(false)
    }
  }

  function moThem() {
    setForm(taoFormMoi())
    setCuaSo('them')
    setLoi('')
  }

  function moSua(km: KhuyenMai) {
    setForm({
      tenChuongTrinh: km.tenChuongTrinh,
      loaiGiamGia: km.loaiGiamGia,
      giaTriGiam: String(km.giaTriGiam),
      hoaDonToiThieu: km.hoaDonToiThieu === null ? '' : String(km.hoaDonToiThieu),
      giamToiDa: km.giamToiDa === null ? '' : String(km.giamToiDa),
      thoiGianBatDau: km.thoiGianBatDau.slice(0, 16),
      thoiGianKetThuc: km.thoiGianKetThuc.slice(0, 16),
      idChiNhanh: [...km.idChiNhanh],
    })
    setCuaSo(km)
    setLoi('')
  }

  function doiChiNhanh(id: number, checked: boolean) {
    setForm((cu) => ({
      ...cu,
      idChiNhanh: checked
        ? [...cu.idChiNhanh, id]
        : cu.idChiNhanh.filter((item) => item !== id),
    }))
  }

  async function luu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cuaSo || dangXuLy) return

    const giaTri = Number(form.giaTriGiam)
    const toiThieu = form.hoaDonToiThieu.trim() ? Number(form.hoaDonToiThieu) : null
    const toiDa = form.giamToiDa.trim() ? Number(form.giamToiDa) : null
    if (!Number.isFinite(giaTri) || giaTri <= 0 ||
        (form.loaiGiamGia === 'PHAN_TRAM' && giaTri > 100) ||
        (toiThieu !== null && (!Number.isFinite(toiThieu) || toiThieu < 0)) ||
        (toiDa !== null && (!Number.isFinite(toiDa) || toiDa <= 0)) ||
        form.idChiNhanh.length === 0) {
      setLoi('Kiểm tra giá trị giảm, điều kiện hóa đơn và chi nhánh áp dụng.')
      return
    }

    const data: DuLieuKhuyenMai = {
      tenChuongTrinh: form.tenChuongTrinh.trim(),
      loaiGiamGia: form.loaiGiamGia,
      giaTriGiam: giaTri,
      hoaDonToiThieu: toiThieu,
      giamToiDa: toiDa,
      thoiGianBatDau: form.thoiGianBatDau,
      thoiGianKetThuc: form.thoiGianKetThuc,
      idChiNhanh: form.idChiNhanh,
    }

    setDangXuLy(true)
    setLoi('')
    setThongBao('')
    try {
      if (cuaSo === 'them') {
        await taoKhuyenMai(data)
        setThongBao('Đã tạo chương trình ở trạng thái Bản nháp.')
      } else {
        await capNhatKhuyenMai(cuaSo.id, data)
        setThongBao('Đã cập nhật chương trình khuyến mãi.')
      }
      setCuaSo(null)
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  async function xuLyCongBo(km: KhuyenMai) {
    if (!window.confirm(`Công bố chương trình “${km.tenChuongTrinh}” đến các chi nhánh đã chọn?`)) return
    setDangXuLy(true)
    setLoi('')
    setThongBao('')
    try {
      await congBoKhuyenMai(km.id)
      setThongBao('Đã công bố chương trình và gửi thông báo đến nhân viên các chi nhánh áp dụng.')
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  async function xuLyNgung(km: KhuyenMai) {
    if (!window.confirm(`Ngừng áp dụng chương trình “${km.tenChuongTrinh}”?`)) return
    setDangXuLy(true)
    setLoi('')
    setThongBao('')
    try {
      await ngungKhuyenMai(km.id)
      setThongBao('Đã ngừng chương trình khuyến mãi.')
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangXuLy(false)
    }
  }

  const tenChiNhanh = (ids: number[]) => chiNhanh
    .filter((cn) => ids.includes(cn.id))
    .map((cn) => cn.tenChiNhanh)
    .join(', ')

  return (
    <section className="container-fluid p-3 p-lg-4 text-start">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Quản lý khuyến mãi</h1>
          <p className="text-secondary mb-0">Tạo, chỉnh sửa, công bố và ngừng chương trình theo chi nhánh.</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => void lamMoi()} disabled={dangTai || dangXuLy}>
            <RefreshCw size={16} className="me-2" />Làm mới
          </button>
          <button type="button" className="btn btn-primary" onClick={moThem} disabled={dangXuLy}>
            <Plus size={16} className="me-2" />Tạo chương trình
          </button>
        </div>
      </div>

      {loi && <div className="alert alert-danger py-2" role="alert">{loi}</div>}
      {thongBao && <div className="alert alert-success py-2" role="status">{thongBao}</div>}

      <div className="card border-0 shadow-sm rounded-3 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-semibold mb-0"><Megaphone size={19} className="text-primary me-2" />Danh sách chương trình</h2>
          <span className="badge text-bg-primary">{danhSach.length} chương trình</span>
        </div>
        {dangTai ? (
          <p className="text-secondary mb-0">Đang tải chương trình khuyến mãi…</p>
        ) : danhSach.length === 0 ? (
          <div className="text-center text-secondary py-5">Chưa có chương trình khuyến mãi.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr><th>Chương trình</th><th>Mức giảm</th><th>Thời gian</th><th>Chi nhánh áp dụng</th><th>Trạng thái</th><th className="text-end">Thao tác</th></tr>
              </thead>
              <tbody>
                {danhSach.map((km) => {
                  const daBatDau = new Date(km.thoiGianBatDau).getTime() <= Date.now()
                  const coTheSua = km.trangThai === 'BAN_NHAP' || (km.trangThai === 'DA_CONG_BO' && !daBatDau)
                  return (
                    <tr key={km.id}>
                      <td className="fw-semibold">{km.tenChuongTrinh}<div className="small text-secondary">#{km.id}</div></td>
                      <td>
                        <strong>{km.loaiGiamGia === 'PHAN_TRAM' ? `${km.giaTriGiam}%` : tienViet.format(km.giaTriGiam)}</strong>
                        {km.hoaDonToiThieu !== null && <div className="small text-secondary">Đơn từ {tienViet.format(km.hoaDonToiThieu)}</div>}
                        {km.giamToiDa !== null && <div className="small text-secondary">Tối đa {tienViet.format(km.giamToiDa)}</div>}
                      </td>
                      <td className="small text-nowrap">{hienThoiGian(km.thoiGianBatDau)}<div className="text-secondary">đến {hienThoiGian(km.thoiGianKetThuc)}</div></td>
                      <td className="small" style={{ minWidth: 180 }}>{tenChiNhanh(km.idChiNhanh) || 'Chưa gán chi nhánh'}</td>
                      <td><span className={`badge ${mauTrangThai(km)}`}>{hienTrangThai(km)}</span></td>
                      <td>
                        <div className="d-flex justify-content-end gap-1">
                          {coTheSua && (
                            <button type="button" className="btn btn-sm btn-outline-primary" title="Sửa" onClick={() => moSua(km)} disabled={dangXuLy}><Pencil size={15} /></button>
                          )}
                          {km.trangThai === 'BAN_NHAP' && (
                            <button type="button" className="btn btn-sm btn-primary" title="Công bố" onClick={() => void xuLyCongBo(km)} disabled={dangXuLy}><Send size={15} /></button>
                          )}
                          {km.trangThai === 'DA_CONG_BO' && (
                            <button type="button" className="btn btn-sm btn-outline-danger" title="Ngừng áp dụng" onClick={() => void xuLyNgung(km)} disabled={dangXuLy}><Square size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cuaSo && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="bg-white rounded-3 shadow w-100" style={{ maxWidth: 760, maxHeight: '94vh', overflow: 'auto' }} role="dialog" aria-modal="true" aria-labelledby="khuyen-mai-tieu-de">
            <div className="d-flex justify-content-between align-items-center border-bottom p-3">
              <h2 id="khuyen-mai-tieu-de" className="h5 fw-semibold mb-0">{cuaSo === 'them' ? 'Tạo chương trình khuyến mãi' : 'Chỉnh sửa chương trình'}</h2>
              <button type="button" className="btn btn-sm btn-light" onClick={() => setCuaSo(null)} disabled={dangXuLy}><X size={18} /></button>
            </div>
            <form className="p-3" onSubmit={luu}>
              <div className="mb-3">
                <label className="form-label" htmlFor="km-ten">Tên chương trình</label>
                <input id="km-ten" className="form-control" maxLength={255} required value={form.tenChuongTrinh} onChange={(e) => setForm((cu) => ({ ...cu, tenChuongTrinh: e.target.value }))} />
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="km-loai">Loại giảm giá</label>
                  <select id="km-loai" className="form-select" value={form.loaiGiamGia} onChange={(e) => setForm((cu) => ({ ...cu, loaiGiamGia: e.target.value as FormKhuyenMai['loaiGiamGia'] }))}>
                    <option value="PHAN_TRAM">Theo phần trăm</option>
                    <option value="SO_TIEN">Theo số tiền</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="km-gia-tri">Giá trị giảm {form.loaiGiamGia === 'PHAN_TRAM' ? '(%)' : '(VNĐ)'}</label>
                  <input id="km-gia-tri" type="number" min="0.01" max={form.loaiGiamGia === 'PHAN_TRAM' ? 100 : undefined} step="0.01" className="form-control" required value={form.giaTriGiam} onChange={(e) => setForm((cu) => ({ ...cu, giaTriGiam: e.target.value }))} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="km-toi-thieu">Hóa đơn tối thiểu (VNĐ)</label>
                  <input id="km-toi-thieu" type="number" min="0" step="0.01" className="form-control" value={form.hoaDonToiThieu} onChange={(e) => setForm((cu) => ({ ...cu, hoaDonToiThieu: e.target.value }))} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="km-toi-da">Giảm tối đa (VNĐ)</label>
                  <input id="km-toi-da" type="number" min="0.01" step="0.01" className="form-control" value={form.giamToiDa} onChange={(e) => setForm((cu) => ({ ...cu, giamToiDa: e.target.value }))} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="km-bat-dau">Thời gian bắt đầu</label>
                  <input id="km-bat-dau" type="datetime-local" className="form-control" required value={form.thoiGianBatDau} onChange={(e) => setForm((cu) => ({ ...cu, thoiGianBatDau: e.target.value }))} />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="km-ket-thuc">Thời gian kết thúc</label>
                  <input id="km-ket-thuc" type="datetime-local" className="form-control" required value={form.thoiGianKetThuc} onChange={(e) => setForm((cu) => ({ ...cu, thoiGianKetThuc: e.target.value }))} />
                </div>
              </div>
              <div className="mt-3">
                <label className="form-label">Chi nhánh áp dụng</label>
                <div className="border rounded-3 p-2" style={{ maxHeight: 180, overflow: 'auto' }}>
                  {chiNhanh.length === 0 ? <div className="small text-secondary">Không có chi nhánh hoạt động.</div> : chiNhanh.map((cn) => (
                    <label key={cn.id} className="d-flex align-items-center gap-2 py-1">
                      <input type="checkbox" className="form-check-input mt-0" checked={form.idChiNhanh.includes(cn.id)} onChange={(e) => doiChiNhanh(cn.id, e.target.checked)} />
                      <span>{cn.tenChiNhanh}</span>
                    </label>
                  ))}
                </div>
                <div className="small text-secondary mt-1">Chương trình chỉ áp dụng tại các chi nhánh được chọn.</div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setCuaSo(null)} disabled={dangXuLy}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={dangXuLy}>{dangXuLy ? 'Đang lưu…' : 'Lưu bản nháp'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
