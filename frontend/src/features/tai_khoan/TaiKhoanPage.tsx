
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, Pencil, Plus, Search, X } from 'lucide-react'
import {
  layDanhSachTaiKhoan,
  layTuyChonTaiKhoan,
  luuTaiKhoan,
  type DuLieuTaiKhoan,
  type TaiKhoan,
  type TrangThaiTaiKhoan,
  type TuyChonTaiKhoan,
} from './taiKhoanApi'

type CuaSo =
  | { kieu: 'them' }
  | { kieu: 'xem' | 'sua'; taiKhoan: TaiKhoan }

function loiTu(error: unknown): string {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.'
}

function boDau(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().trim()
}

export default function TaiKhoanPage() {
  const [danhSach, setDanhSach] = useState<TaiKhoan[]>([])
  const [tuyChon, setTuyChon] = useState<TuyChonTaiKhoan | null>(null)
  const [tuKhoa, setTuKhoa] = useState('')
  const [locVaiTro, setLocVaiTro] = useState('')
  const [locTrangThai, setLocTrangThai] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')
  const [cuaSo, setCuaSo] = useState<CuaSo | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function taiDuLieu() {
      try {
        const [taiKhoan, options] = await Promise.all([
          layDanhSachTaiKhoan(controller.signal),
          layTuyChonTaiKhoan(controller.signal),
        ])
        if (!controller.signal.aborted) {
          setDanhSach(taiKhoan)
          setTuyChon(options)
        }
      } catch (error) {
        if (!controller.signal.aborted) setLoi(loiTu(error))
      } finally {
        if (!controller.signal.aborted) setDangTai(false)
      }
    }
    void taiDuLieu()
    return () => controller.abort()
  }, [])

  const ketQua = danhSach.filter((tk) => {
    const chuoiTim = boDau([tk.hoTen, tk.tenDangNhap, tk.soDienThoai ?? '', tk.tenChiNhanh ?? ''].join(' '))
    return chuoiTim.includes(boDau(tuKhoa))
      && (!locVaiTro || tk.maVaiTro === locVaiTro)
      && (!locTrangThai || tk.trangThai === locTrangThai)
  })

  function sauKhiLuu(tk: TaiKhoan) {
    const dangThem = cuaSo?.kieu === 'them'
    setDanhSach((cu) => dangThem
      ? [tk, ...cu]
      : cu.map((item) => item.id === tk.id ? tk : item))
    setThongBao(`${dangThem ? 'Đã thêm' : 'Đã cập nhật'} tài khoản ${tk.tenDangNhap}.`)
    setCuaSo(null)
  }

  return (
    <section className="w-100 p-3 p-md-4 text-start">
      <h1 className="h3 fw-bold mb-4">Quản lý tài khoản nhân viên</h1>

      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-lg">
          <div className="input-group">
            <span className="input-group-text bg-white"><Search size={18} aria-hidden="true" /></span>
            <input
              type="search"
              className="form-control"
              aria-label="Tìm kiếm tài khoản"
              placeholder="Tìm họ tên, tên đăng nhập, số điện thoại, chi nhánh..."
              value={tuKhoa}
              onChange={(event) => setTuKhoa(event.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-lg-2">
          <select className="form-select" aria-label="Lọc vai trò" value={locVaiTro} onChange={(e) => setLocVaiTro(e.target.value)}>
            <option value="">Mọi vai trò</option>
            {tuyChon?.vaiTro.map((v) => (
              <option key={v.id} value={v.maVaiTro}>{v.tenVaiTro}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-lg-2">
          <select className="form-select" aria-label="Lọc trạng thái" value={locTrangThai} onChange={(e) => setLocTrangThai(e.target.value)}>
            <option value="">Mọi trạng thái</option>
            <option value="HOAT_DONG">Hoạt động</option>
            <option value="BI_KHOA">Bị khóa</option>
          </select>
        </div>
        <div className="col-12 col-lg-auto d-grid">
          <button
            type="button"
            className="btn btn-primary d-flex justify-content-center align-items-center gap-2"
            disabled={dangTai || Boolean(loi) || !tuyChon}
            onClick={() => { setThongBao(''); setCuaSo({ kieu: 'them' }) }}
          >
            <Plus size={18} /> Thêm tài khoản
          </button>
        </div>
      </div>

      {thongBao && <div role="status" className="alert alert-success py-2">{thongBao}</div>}
      {loi && <div role="alert" className="alert alert-danger py-2">{loi}</div>}

      <div className="table-responsive bg-white border rounded-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-nowrap">
            <tr>
              <th scope="col" className="px-3 py-3">Họ tên</th>
              <th scope="col">Tên đăng nhập</th>
              <th scope="col">Vai trò</th>
              <th scope="col">Chi nhánh</th>
              <th scope="col">Số điện thoại</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ketQua.map((tk) => (
              <tr key={tk.id}>
                <td className="px-3 fw-semibold">{tk.hoTen}</td>
                <td>{tk.tenDangNhap}</td>
                <td>{tk.tenVaiTro}</td>
                <td>{tk.tenChiNhanh ?? 'Toàn chuỗi'}</td>
                <td>{tk.soDienThoai ?? '—'}</td>
                <td>
                  <span className={`badge ${tk.trangThai === 'HOAT_DONG' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                    {tk.trangThai === 'HOAT_DONG' ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button type="button" title="Xem chi tiết" aria-label={`Xem ${tk.hoTen}`}
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setCuaSo({ kieu: 'xem', taiKhoan: tk })}>
                      <Eye size={16} />
                    </button>
                    <button type="button" title="Chỉnh sửa" aria-label={`Sửa ${tk.hoTen}`}
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => { setThongBao(''); setCuaSo({ kieu: 'sua', taiKhoan: tk }) }}>
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loi && ketQua.length === 0 && (
              <tr><td colSpan={7} className="text-center text-secondary py-4">
                {dangTai ? 'Đang tải tài khoản…' : danhSach.length === 0 ? 'Chưa có tài khoản.' : 'Không tìm thấy tài khoản phù hợp.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {cuaSo && tuyChon && (
        <CuaSoTaiKhoan
          key={cuaSo.kieu === 'them' ? 'them' : `${cuaSo.kieu}-${cuaSo.taiKhoan.id}`}
          cuaSo={cuaSo}
          tuyChon={tuyChon}
          onDong={() => setCuaSo(null)}
          onLuu={sauKhiLuu}
        />
      )}
    </section>
  )
}

function CuaSoTaiKhoan({
  cuaSo, tuyChon, onDong, onLuu,
}: {
  cuaSo: CuaSo
  tuyChon: TuyChonTaiKhoan
  onDong: () => void
  onLuu: (taiKhoan: TaiKhoan) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const tk = cuaSo.kieu === 'them' ? undefined : cuaSo.taiKhoan
  const chiXem = cuaSo.kieu === 'xem'
  const dangThem = cuaSo.kieu === 'them'

  const [idVaiTro, setIdVaiTro] = useState(tk ? String(tk.idVaiTro) : '')
  const [idChiNhanh, setIdChiNhanh] = useState(tk?.idChiNhanh ? String(tk.idChiNhanh) : '')
  const [trangThai, setTrangThai] = useState<TrangThaiTaiKhoan>(tk?.trangThai ?? 'HOAT_DONG')
  const [matKhau, setMatKhau] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState('')

  const maVaiTro = tuyChon.vaiTro.find((v) => String(v.id) === idVaiTro)?.maVaiTro
  const laAdmin = maVaiTro === 'ADMIN'

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  async function guiForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (chiXem || dangLuu) return

    const form = new FormData(event.currentTarget)
    const doc = (key: string) => String(form.get(key) ?? '').trim()

    if (!idVaiTro || (!laAdmin && !idChiNhanh)) {
      setLoi('Vui lòng chọn vai trò và chi nhánh phù hợp.')
      return
    }
    if (dangThem && !matKhau) {
      setLoi('Vui lòng nhập mật khẩu ban đầu.')
      return
    }
    if (matKhau && matKhau.length < 8) {
      setLoi('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (matKhau && new TextEncoder().encode(matKhau).length > 72) {
      setLoi('Mật khẩu tối đa 72 byte UTF-8.')
      return
    }

    const duLieu: DuLieuTaiKhoan = {
      hoTen: doc('hoTen'),
      tenDangNhap: doc('tenDangNhap'),
      soDienThoai: doc('soDienThoai') || null,
      idVaiTro: Number(idVaiTro),
      idChiNhanh: laAdmin ? null : Number(idChiNhanh),
      trangThai,
      matKhau: matKhau || null,
    }

    setLoi('')
    setDangLuu(true)
    try {
      const daLuu = await luuTaiKhoan(duLieu, tk?.id)
      onLuu(daLuu)
    } catch (error) {
      setLoi(loiTu(error))
      setDangLuu(false)
    }
  }

  const tieuDe = { them: 'Thêm tài khoản', xem: 'Chi tiết tài khoản', sua: 'Chỉnh sửa tài khoản' }[cuaSo.kieu]

  return (
    <dialog
      ref={dialog}
      aria-labelledby="tieu-de-cua-so-tai-khoan"
      className="border-0 rounded-3 shadow p-0 col-11 col-md-8 col-lg-6 col-xl-5"
      onCancel={(event) => {
        event.preventDefault()
        if (!dangLuu) onDong()
      }}
    >
      <form onSubmit={(event) => void guiForm(event)}>
        <div className="d-flex align-items-center justify-content-between border-bottom px-4 py-3">
          <h2 id="tieu-de-cua-so-tai-khoan" className="h5 mb-0">{tieuDe}</h2>
          <button type="button" className="btn btn-sm btn-light" aria-label="Đóng"
            onClick={onDong} disabled={dangLuu}><X size={18} /></button>
        </div>

        <div className="p-3 p-md-4">
          {loi && <p className="alert alert-danger py-2" role="alert">{loi}</p>}

          <fieldset disabled={chiXem || dangLuu} className="row g-3">
            <label className="col-12">
              Họ tên
              <input name="hoTen" className="form-control mt-1" defaultValue={tk?.hoTen}
                required maxLength={255} />
            </label>
            <label className="col-sm-6">
              Tên đăng nhập
              <input name="tenDangNhap" className="form-control mt-1" defaultValue={tk?.tenDangNhap}
                autoComplete="off" required maxLength={100} />
            </label>
            <label className="col-sm-6">
              Số điện thoại (không bắt buộc)
              <input name="soDienThoai" className="form-control mt-1" defaultValue={tk?.soDienThoai ?? ''}
                type="tel" maxLength={20} />
            </label>
            <label className="col-sm-6">
              Vai trò
              <select className="form-select mt-1" value={idVaiTro} required
                onChange={(e) => {
                  setIdVaiTro(e.target.value)
                  const v = tuyChon.vaiTro.find((item) => String(item.id) === e.target.value)
                  if (v?.maVaiTro === 'ADMIN') setIdChiNhanh('')
                }}>
                <option value="">Chọn vai trò</option>
                {tuyChon.vaiTro.map((v) => (
                  <option key={v.id} value={v.id}>{v.tenVaiTro}</option>
                ))}
              </select>
            </label>
            <label className="col-sm-6">
              Chi nhánh
              <select className="form-select mt-1" value={idChiNhanh}
                disabled={laAdmin} required={!laAdmin}
                onChange={(e) => setIdChiNhanh(e.target.value)}>
                <option value="">{laAdmin ? 'Toàn chuỗi (không chọn)' : 'Chọn chi nhánh'}</option>
                {tuyChon.chiNhanh.map((cn) => (
                  <option key={cn.id} value={cn.id}>{cn.tenChiNhanh}</option>
                ))}
              </select>
            </label>
            <label className="col-sm-6">
              Trạng thái
              <select className="form-select mt-1" value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as TrangThaiTaiKhoan)}>
                <option value="HOAT_DONG">Hoạt động</option>
                <option value="BI_KHOA">Bị khóa</option>
              </select>
            </label>
            {!chiXem && (
              <label className="col-sm-6">
                {dangThem ? 'Mật khẩu ban đầu' : 'Mật khẩu mới (bỏ trống để giữ nguyên)'}
                <input className="form-control mt-1" type="password" name="matKhau"
                  autoComplete="new-password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
                  minLength={8} required={dangThem} />
              </label>
            )}
          </fieldset>
          {!dangThem && !chiXem && (
            <p className="small text-secondary mt-3 mb-0">Để trống mật khẩu nếu không muốn đổi. Không tự khóa hoặc đổi vai trò/tên đăng nhập của tài khoản Admin đang sử dụng.</p>
          )}
        </div>

        <div className="d-flex justify-content-end gap-2 border-top px-4 py-3">
          <button type="button" className="btn btn-outline-secondary" onClick={onDong} disabled={dangLuu}>
            {chiXem ? 'Đóng' : 'Hủy'}
          </button>
          {!chiXem && (
            <button type="submit" className="btn btn-primary" disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : dangThem ? 'Thêm tài khoản' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}
