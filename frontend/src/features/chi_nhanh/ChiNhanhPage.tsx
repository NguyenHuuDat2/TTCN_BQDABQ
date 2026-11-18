import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, Pencil, Plus, Search } from 'lucide-react'
import { layDanhSachChiNhanh, luuChiNhanh, type ChiNhanh } from './chiNhanhApi'

type CuaSo =
  | { kieu: 'them' }
  | { kieu: 'xem' | 'sua'; chiNhanh: ChiNhanh }

function boDau(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd')
    .toLowerCase().trim()
}

function hienTrangThai(value: string) {
  return value === 'HOAT_DONG' ? 'Hoạt động' : value
}

function loiTu(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.'
}

export default function ChiNhanhPage() {
  const [danhSach, setDanhSach] = useState<ChiNhanh[]>([])
  const [tuKhoa, setTuKhoa] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')
  const [cuaSo, setCuaSo] = useState<CuaSo | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function taiDuLieu() {
      try {
        const duLieu = await layDanhSachChiNhanh(controller.signal)
        if (!controller.signal.aborted) setDanhSach(duLieu)
      } catch (error) {
        if (!controller.signal.aborted) setLoi(loiTu(error))
      } finally {
        if (!controller.signal.aborted) setDangTai(false)
      }
    }

    void taiDuLieu()
    return () => controller.abort()
  }, [])

  const tuKhoaTim = boDau(tuKhoa)
  const ketQua = danhSach.filter((cn) =>
    boDau([cn.maChiNhanh, cn.tenChiNhanh, cn.diaChi, cn.soDienThoai ?? ''].join(' '))
      .includes(tuKhoaTim),
  )

  function moCuaSo(cuaSoMoi: CuaSo) {
    setThongBao('')
    setCuaSo(cuaSoMoi)
  }

  function sauKhiLuu(cn: ChiNhanh) {
    const dangThem = cuaSo?.kieu === 'them'
    setDanhSach((cu) => dangThem
      ? [cn, ...cu]
      : cu.map((item) => item.id === cn.id ? cn : item))
    setThongBao(`${dangThem ? 'Đã thêm' : 'Đã cập nhật'} chi nhánh ${cn.maChiNhanh}.`)
    setCuaSo(null)
  }

  return (
    <section className="w-100 p-3 p-md-4 text-start">
      <h1 className="h3 fw-bold mb-4">Quản lý chi nhánh</h1>

      <div className="row g-2 mb-3">
        <div className="col-12 col-md">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Search size={18} aria-hidden="true" />
            </span>
            <input
              type="search"
              className="form-control"
              aria-label="Tìm kiếm chi nhánh"
              placeholder="Tìm mã, tên, địa chỉ hoặc số điện thoại..."
              value={tuKhoa}
              onChange={(event) => setTuKhoa(event.target.value)}
            />
          </div>
        </div>
        <div className="col-12 col-md-auto d-grid">
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
            disabled={dangTai || Boolean(loi)}
            onClick={() => moCuaSo({ kieu: 'them' })}
          >
            <Plus size={18} aria-hidden="true" /> Thêm chi nhánh
          </button>
        </div>
      </div>

      {thongBao && <div className="alert alert-success py-2" role="status">{thongBao}</div>}
      {loi && <div className="alert alert-danger py-2" role="alert">{loi}</div>}

      <div className="table-responsive bg-white border rounded-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-nowrap">
            <tr>
              <th scope="col" className="px-3 py-3">Mã chi nhánh</th>
              <th scope="col">Tên chi nhánh</th>
              <th scope="col">Địa chỉ</th>
              <th scope="col">Số điện thoại</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {ketQua.map((cn) => (
              <tr key={cn.id}>
                <td className="px-3">{cn.maChiNhanh}</td>
                <td className="fw-semibold">{cn.tenChiNhanh}</td>
                <td>{cn.diaChi}</td>
                <td>{cn.soDienThoai ?? '—'}</td>
                <td>
                  <span className={`badge ${cn.trangThai === 'HOAT_DONG'
                    ? 'text-bg-success' : 'text-bg-secondary'}`}>
                    {hienTrangThai(cn.trangThai)}
                  </span>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      title="Xem chi tiết"
                      aria-label={`Xem ${cn.tenChiNhanh}`}
                      onClick={() => moCuaSo({ kieu: 'xem', chiNhanh: cn })}
                    >
                      <Eye size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      title="Chỉnh sửa"
                      aria-label={`Sửa ${cn.tenChiNhanh}`}
                      onClick={() => moCuaSo({ kieu: 'sua', chiNhanh: cn })}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loi && ketQua.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-4">
                  {dangTai ? 'Đang tải chi nhánh…' : danhSach.length === 0
                    ? 'Chưa có chi nhánh.' : 'Không tìm thấy chi nhánh phù hợp.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cuaSo && (
        <CuaSoChiNhanh
          cuaSo={cuaSo}
          onDong={() => setCuaSo(null)}
          onLuu={sauKhiLuu}
        />
      )}
    </section>
  )
}

function CuaSoChiNhanh({ cuaSo, onDong, onLuu }: {
  cuaSo: CuaSo
  onDong: () => void
  onLuu: (chiNhanh: ChiNhanh) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState('')
  const cn = cuaSo.kieu === 'them' ? undefined : cuaSo.chiNhanh
  const chiXem = cuaSo.kieu === 'xem'
  const tieuDe = {
    them: 'Thêm chi nhánh',
    xem: 'Chi tiết chi nhánh',
    sua: 'Chỉnh sửa chi nhánh',
  }[cuaSo.kieu]

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  async function guiForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (chiXem || dangLuu) return

    const form = new FormData(event.currentTarget)
    const doc = (ten: string) => String(form.get(ten) ?? '').trim()
    const maChiNhanh = doc('maChiNhanh')
    const tenChiNhanh = doc('tenChiNhanh')
    const diaChi = doc('diaChi')

    if (!maChiNhanh || !tenChiNhanh || !diaChi) {
      setLoi('Vui lòng nhập mã, tên và địa chỉ chi nhánh.')
      return
    }

    setLoi('')
    setDangLuu(true)

    try {
      const daLuu = await luuChiNhanh({
        maChiNhanh,
        tenChiNhanh,
        diaChi,
        soDienThoai: doc('soDienThoai') || null,
      }, cn?.id)
      onLuu(daLuu)
    } catch (error) {
      setLoi(loiTu(error))
      setDangLuu(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="border-0 rounded-3 shadow p-0 col-11 col-md-8 col-lg-6 col-xl-5"
      aria-labelledby="tieu-de-chi-nhanh"
      onCancel={(event) => {
        event.preventDefault()
        if (!dangLuu) onDong()
      }}
    >
      <form onSubmit={(event) => void guiForm(event)}>
        <div className="border-bottom px-4 py-3">
          <h2 id="tieu-de-chi-nhanh" className="h5 mb-0">{tieuDe}</h2>
        </div>

        <div className="p-3 p-md-4">
          {loi && <p className="alert alert-danger py-2" role="alert">{loi}</p>}
          <fieldset className="row g-3" disabled={chiXem || dangLuu}>
            <label className="col-sm-5">
              Mã chi nhánh
              <input name="maChiNhanh" className="form-control mt-1"
                defaultValue={cn?.maChiNhanh} maxLength={50} required />
            </label>
            <label className="col-sm-7">
              Tên chi nhánh
              <input name="tenChiNhanh" className="form-control mt-1"
                defaultValue={cn?.tenChiNhanh} maxLength={255} required />
            </label>
            <label className="col-12">
              Địa chỉ
              <input name="diaChi" className="form-control mt-1"
                defaultValue={cn?.diaChi} maxLength={500} required />
            </label>
            <label className="col-sm-7">
              Số điện thoại (không bắt buộc)
              <input name="soDienThoai" type="tel" className="form-control mt-1"
                defaultValue={cn?.soDienThoai ?? ''} maxLength={20} />
            </label>
          </fieldset>
          <p className="mt-3 mb-0">Trạng thái: {hienTrangThai(cn?.trangThai ?? 'HOAT_DONG')}</p>
        </div>

        <div className="d-flex justify-content-end gap-2 border-top px-4 py-3">
          <button type="button" className="btn btn-outline-secondary"
            disabled={dangLuu} onClick={onDong}>
            {chiXem ? 'Đóng' : 'Hủy'}
          </button>
          {!chiXem && (
            <button type="submit" className="btn btn-primary" disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : cuaSo.kieu === 'them' ? 'Thêm chi nhánh' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}