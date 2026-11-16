import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Eye, Pencil, Plus, ScanBarcode, Search, X } from 'lucide-react'
import QuetMaVach from '../../components/QuetMaVach'
import { layDanhSachDanhMuc, type DanhMuc } from '../danh_muc/danhMucApi'
import {
  layDanhSachSanPham,
  luuSanPham,
  type DuLieuSanPham,
  type SanPham,
} from './sanPhamApi'

const nhanTrangThai: Record<string, string> = {
  DANG_DUNG: 'Đang dùng',
  NGUNG_DUNG: 'Ngừng dùng',
}

const dinhDangTien = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 2,
})

type CuaSo =
  | { kieu: 'them' }
  | { kieu: 'xem' | 'sua'; sanPham: SanPham }

type PropsCuaSo = {
  cuaSo: CuaSo
  danhMuc: DanhMuc[]
  onDong: () => void
  onLuu: (sanPham: SanPham) => void
}

function thongBaoLoi(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi khi xử lý dữ liệu.'
}

function chuanHoa(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .trim()
    .toLowerCase()
}

export default function SanPhamPage() {
  const [sanPham, setSanPham] = useState<SanPham[]>([])
  const [danhMuc, setDanhMuc] = useState<DanhMuc[]>([])
  const [tuKhoa, setTuKhoa] = useState('')
  const [locDanhMuc, setLocDanhMuc] = useState('')
  const [locTrangThai, setLocTrangThai] = useState('')
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')
  const [cuaSo, setCuaSo] = useState<CuaSo | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function taiDuLieu() {
      try {
        const [dsSanPham, dsDanhMuc] = await Promise.all([
          layDanhSachSanPham(controller.signal),
          layDanhSachDanhMuc(controller.signal),
        ])

        if (controller.signal.aborted) return

        setSanPham(dsSanPham)
        setDanhMuc(dsDanhMuc)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoi(thongBaoLoi(error))
        }
      } finally {
        if (!controller.signal.aborted) {
          setDangTai(false)
        }
      }
    }

    void taiDuLieu()

    return () => controller.abort()
  }, [])

  const tuKhoaTim = chuanHoa(tuKhoa)

  const ketQua = sanPham.filter((sp) => {
    const khopTuKhoa = [sp.tenSanPham, sp.maSanPham, sp.maVach ?? '']
      .some((value) => chuanHoa(value).includes(tuKhoaTim))

    const khopDanhMuc = !locDanhMuc || String(sp.idDanhMuc) === locDanhMuc
    const khopTrangThai = !locTrangThai || sp.trangThai === locTrangThai

    return khopTuKhoa && khopDanhMuc && khopTrangThai
  })

  const cacTrangThai = [...new Set([
    ...Object.keys(nhanTrangThai),
    ...sanPham.map((sp) => sp.trangThai),
  ])]

  function moCuaSo(giaTri: CuaSo) {
    setThongBao('')
    setCuaSo(giaTri)
  }

  function sauKhiLuu(sp: SanPham) {
    const dangThem = cuaSo?.kieu === 'them'

    setSanPham((ds) =>
      dangThem
        ? [sp, ...ds]
        : ds.map((item) => item.id === sp.id ? sp : item),
    )

    setThongBao(
      `${dangThem ? 'Đã thêm' : 'Đã cập nhật'} sản phẩm ${sp.maSanPham}.`,
    )
    setCuaSo(null)
  }

  return (
    <section
      className="w-100 p-3 p-md-4 text-start"
      aria-labelledby="tieu-de-san-pham"
    >
      <h1 id="tieu-de-san-pham" className="h3 fw-bold mb-4">
        Quản lý sản phẩm
      </h1>

      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-lg">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <Search size={17} aria-hidden="true" />
            </span>

            <input
              className="form-control"
              type="search"
              aria-label="Tìm theo tên, mã sản phẩm hoặc mã vạch"
              placeholder="Tìm tên / mã vạch..."
              value={tuKhoa}
              onChange={(event) => setTuKhoa(event.target.value)}
            />
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <select
            className="form-select"
            aria-label="Lọc theo danh mục"
            value={locDanhMuc}
            onChange={(event) => setLocDanhMuc(event.target.value)}
          >
            <option value="">Danh mục</option>

            {danhMuc.map((dm) => (
              <option key={dm.id} value={dm.id}>
                {dm.tenDanhMuc}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-lg-2">
          <select
            className="form-select"
            aria-label="Lọc theo trạng thái"
            value={locTrangThai}
            onChange={(event) => setLocTrangThai(event.target.value)}
          >
            <option value="">Trạng thái</option>

            {cacTrangThai.map((tt) => (
              <option key={tt} value={tt}>
                {nhanTrangThai[tt] ?? tt}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-lg-auto d-grid">
          <button
            type="button"
            className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"
            disabled={dangTai || Boolean(loi) || danhMuc.length === 0}
            onClick={() => moCuaSo({ kieu: 'them' })}
          >
            <Plus size={17} aria-hidden="true" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {thongBao && (
        <p className="alert alert-success py-2" role="status">
          {thongBao}
        </p>
      )}

      {loi && (
        <p className="alert alert-danger py-2" role="alert">
          {loi}
        </p>
      )}

      <div className="table-responsive bg-white border rounded-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light text-nowrap">
            <tr>
              {[
                'Mã sản phẩm',
                'Tên sản phẩm',
                'Mã vạch',
                'Giá bán',
                'Trạng thái',
                'Thao tác',
              ].map((cot) => (
                <th key={cot} scope="col" className="px-3 py-3">
                  {cot}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ketQua.map((sp) => (
              <tr key={sp.id}>
                <td className="px-3 text-nowrap">{sp.maSanPham}</td>
                <td className="px-3">{sp.tenSanPham}</td>
                <td className="px-3 text-nowrap">{sp.maVach || '—'}</td>
                <td className="px-3 text-nowrap">
                  {dinhDangTien.format(sp.giaBan)}
                </td>
                <td className="px-3">
                  <span
                    className={`badge ${
                      sp.trangThai === 'DANG_DUNG' ? 'bg-success' : 'bg-secondary'
                    }`}
                  >
                    {nhanTrangThai[sp.trangThai] ?? sp.trangThai}
                  </span>
                </td>
                <td className="px-3">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      aria-label={`Xem ${sp.tenSanPham}`}
                      title="Xem chi tiết"
                      onClick={() => moCuaSo({ kieu: 'xem', sanPham: sp })}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      aria-label={`Sửa ${sp.tenSanPham}`}
                      title="Chỉnh sửa"
                      onClick={() => moCuaSo({ kieu: 'sua', sanPham: sp })}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loi && ketQua.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-4">
                  {dangTai
                    ? 'Đang tải sản phẩm…'
                    : sanPham.length === 0
                      ? 'Chưa có sản phẩm.'
                      : 'Không tìm thấy sản phẩm phù hợp.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cuaSo && (
        <CuaSoSanPham
          cuaSo={cuaSo}
          danhMuc={danhMuc}
          onDong={() => setCuaSo(null)}
          onLuu={sauKhiLuu}
        />
      )}
    </section>
  )
}

function CuaSoSanPham({ cuaSo, danhMuc, onDong, onLuu }: PropsCuaSo) {
  const dialog = useRef<HTMLDialogElement>(null)
  const sp = cuaSo.kieu === 'them' ? undefined : cuaSo.sanPham
  const chiXem = cuaSo.kieu === 'xem'

  const [maVach, setMaVach] = useState(sp?.maVach ?? '')
  const [dangQuet, setDangQuet] = useState(false)
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState('')

  const tieuDe = {
    them: 'Thêm sản phẩm',
    sua: 'Chỉnh sửa sản phẩm',
    xem: 'Chi tiết sản phẩm',
  }[cuaSo.kieu]

  useEffect(() => {
    const node = dialog.current
    node?.showModal()

    return () => node?.close()
  }, [])

  function nhanMaVach(ma: string) {
    setMaVach(ma)
    setDangQuet(false)
    setLoi('')
  }

  async function guiForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (chiXem || dangLuu || dangQuet) return

    const form = new FormData(event.currentTarget)
    const doc = (ten: string) => String(form.get(ten) ?? '').trim()

    const duLieu: DuLieuSanPham = {
      maSanPham: doc('maSanPham'),
      tenSanPham: doc('tenSanPham'),
      idDanhMuc: Number(doc('idDanhMuc')),
      maVach: maVach.trim() || null,
      donViTinh: doc('donViTinh'),
      giaBan: Number(doc('giaBan')),
      trangThai: doc('trangThai'),
    }

    if (!duLieu.maSanPham || !duLieu.tenSanPham || !duLieu.donViTinh) {
      setLoi('Vui lòng nhập mã sản phẩm, tên sản phẩm và đơn vị tính.')
      return
    }

    setLoi('')
    setDangLuu(true)

    try {
      const sanPhamDaLuu = await luuSanPham(duLieu, sp?.id)
      onLuu(sanPhamDaLuu)
    } catch (error) {
      setLoi(thongBaoLoi(error))
      setDangLuu(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="tieu-de-cua-so-san-pham"
      className="border-0 rounded-3 shadow p-0 col-11 col-md-8 col-lg-6 col-xl-5"
      onCancel={(event) => {
        event.preventDefault()

        if (dangLuu) return
        if (dangQuet) {
          setDangQuet(false)
          return
        }

        onDong()
      }}
    >
      <form onSubmit={guiForm}>
        <div className="d-flex align-items-center justify-content-between border-bottom px-4 py-3">
          <h2 id="tieu-de-cua-so-san-pham" className="h5 mb-0">
            {tieuDe}
          </h2>

          <button
            type="button"
            className="btn btn-sm btn-light"
            aria-label="Đóng cửa sổ"
            disabled={dangLuu}
            onClick={onDong}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 p-md-4">
          {loi && (
            <p role="alert" className="alert alert-danger py-2">
              {loi}
            </p>
          )}

          <fieldset disabled={chiXem || dangLuu} className="row g-3">
            <label className="col-sm-6">
              Mã sản phẩm
              <input
                className="form-control mt-1"
                name="maSanPham"
                defaultValue={sp?.maSanPham}
                maxLength={50}
                required
              />
            </label>

            <div className="col-sm-6">
              <label className="form-label mb-1" htmlFor="sp-ma-vach">
                Mã vạch
              </label>

              <div className="input-group">
                <input
                  id="sp-ma-vach"
                  name="maVach"
                  className="form-control"
                  type="text"
                  autoComplete="off"
                  value={maVach}
                  maxLength={100}
                  placeholder="Nhập hoặc quét mã"
                  onChange={(event) => setMaVach(event.target.value)}
                />

                {!chiXem && (
                  <button
                    type="button"
                    className="btn btn-outline-primary d-inline-flex align-items-center gap-1"
                    aria-expanded={dangQuet}
                    onClick={() => setDangQuet((mo) => !mo)}
                  >
                    <ScanBarcode size={17} aria-hidden="true" />
                    {dangQuet ? 'Tắt camera' : 'Quét mã'}
                  </button>
                )}
              </div>
            </div>

            {dangQuet && !chiXem && (
              <div className="col-12">
                <QuetMaVach
                  onDong={() => setDangQuet(false)}
                  onQuetDuoc={nhanMaVach}
                />
              </div>
            )}

            <label className="col-12">
              Tên sản phẩm
              <input
                className="form-control mt-1"
                name="tenSanPham"
                defaultValue={sp?.tenSanPham}
                maxLength={255}
                required
              />
            </label>

            <label className="col-sm-6">
              Danh mục
              <select
                className="form-select mt-1"
                name="idDanhMuc"
                defaultValue={sp?.idDanhMuc ?? ''}
                required
              >
                <option value="">Chọn danh mục</option>

                {danhMuc.map((dm) => (
                  <option key={dm.id} value={dm.id}>
                    {dm.tenDanhMuc}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-sm-6">
              Đơn vị tính
              <input
                className="form-control mt-1"
                name="donViTinh"
                defaultValue={sp?.donViTinh}
                maxLength={50}
                required
              />
            </label>

            <label className="col-sm-6">
              Giá bán (đồng)
              <input
                className="form-control mt-1"
                name="giaBan"
                type="number"
                defaultValue={sp?.giaBan}
                min="0"
                step="0.01"
                required
              />
            </label>

            <label className="col-sm-6">
              Trạng thái
              <select
                className="form-select mt-1"
                name="trangThai"
                defaultValue={sp?.trangThai ?? 'DANG_DUNG'}
                required
              >
                {Object.entries(nhanTrangThai).map(([ma, ten]) => (
                  <option key={ma} value={ma}>
                    {ten}
                  </option>
                ))}

                {sp && !(sp.trangThai in nhanTrangThai) && (
                  <option value={sp.trangThai}>{sp.trangThai}</option>
                )}
              </select>
            </label>
          </fieldset>
        </div>

        <div className="d-flex justify-content-end gap-2 border-top px-4 py-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={dangLuu}
            onClick={onDong}
          >
            {chiXem ? 'Đóng' : 'Hủy'}
          </button>

          {!chiXem && (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={dangLuu || dangQuet}
            >
              {dangLuu ? 'Đang lưu…' : 'Lưu sản phẩm'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  )
}