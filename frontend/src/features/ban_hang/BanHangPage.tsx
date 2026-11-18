import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, Printer, Search, ShoppingCart, Trash2 } from 'lucide-react'
import QuetMaVach from '../../components/QuetMaVach'
import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'
import {
  layDanhSachSanPham,
  traSanPhamTheoMaVach,
  type SanPham,
} from '../san_pham/sanPhamApi'

type PhuongThuc = 'TIEN_MAT' | 'QR'

type KhachHang = {
  id: number
  hoTen: string
  soDienThoai: string
}

type DongGioHang = {
  sanPham: SanPham
  soLuong: number
}

type PhieuThu = {
  maYeuCau: string
  phuongThuc: PhuongThuc
  idKhachHang: number | null
  tienKhachDua: number | null
  gioHang: {
    idSanPham: number
    donGia: number
    soLuong: number
  }[]
}

type DongBienLai = {
  tenSanPham: string
  soLuong: number
  donGia: number
  thanhTien: number
}

type BienLai = {
  soHoaDon: string
  thoiGian: string
  tenChiNhanh: string
  tenThuNgan: string
  tenKhachHang: string
  phuongThuc: PhuongThuc
  tongTien: number
  tienKhachDua: number
  tienTraLai: number
  chiTiet: DongBienLai[]
}

const menhGiaViet = [
  1_000, 2_000, 5_000,
  10_000, 20_000, 50_000,
  100_000, 200_000, 500_000,
]

const cacPhuongThuc: PhuongThuc[] = ['TIEN_MAT', 'QR']

const tenPhuongThuc: Record<PhuongThuc, string> = {
  TIEN_MAT: 'Tiền mặt',
  QR: 'Chuyển khoản QR',
}

const tienViet = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 2,
})

function chuanHoa(value: string) {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/đ/g, 'd')
}

function thanhTienTheoXu(dong: DongGioHang) {
  return Math.round(dong.sanPham.giaBan * 100) * dong.soLuong
}

function docTienTheoXu(value: string): number | null {
  const chuoi = value.trim()
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(chuoi)) return null

  const [dong, le = ''] = chuoi.replace(',', '.').split('.')
  const soXu = Number(dong) * 100 + Number(le.padEnd(2, '0'))
  return Number.isSafeInteger(soXu) ? soXu : null
}

function laBienLai(value: unknown): value is BienLai {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<BienLai>

  return (
    typeof v.soHoaDon === 'string' && v.soHoaDon.length > 0 &&
    typeof v.thoiGian === 'string' &&
    typeof v.tenChiNhanh === 'string' &&
    typeof v.tenThuNgan === 'string' &&
    typeof v.tenKhachHang === 'string' &&
    (v.phuongThuc === 'TIEN_MAT' || v.phuongThuc === 'QR') &&
    Number.isFinite(v.tongTien) &&
    Number.isFinite(v.tienKhachDua) &&
    Number.isFinite(v.tienTraLai) &&
    Array.isArray(v.chiTiet) && v.chiTiet.length > 0 &&
    v.chiTiet.every((d) =>
      d && typeof d.tenSanPham === 'string' &&
      Number.isInteger(d.soLuong) && d.soLuong > 0 &&
      Number.isFinite(d.donGia) && Number.isFinite(d.thanhTien),
    )
  )
}

function CuaSoBienLai({
  bienLai,
  onDong,
}: {
  bienLai: BienLai
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
        <h2 id="pos-tieu-de-bien-lai" className="h4 text-center mb-1">
          Hóa đơn bán hàng
        </h2>
        <p className="text-center fw-semibold mb-3">{bienLai.tenChiNhanh}</p>

        <div className="small text-break">Số hóa đơn: {bienLai.soHoaDon}</div>
        <div className="small">Thời gian: {bienLai.thoiGian}</div>
        <div className="small">Thu ngân: {bienLai.tenThuNgan}</div>
        <div className="small">Khách hàng: {bienLai.tenKhachHang}</div>
        <div className="small">Phương thức: {tenPhuongThuc[bienLai.phuongThuc]}</div>

        <table className="table table-sm align-middle mt-3">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th className="text-center">SL</th>
              <th className="text-end">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {bienLai.chiTiet.map((dong, index) => (
              <tr key={index}>
                <td>
                  <div>{dong.tenSanPham}</div>
                  <small>{tienViet.format(dong.donGia)}</small>
                </td>
                <td className="text-center">{dong.soLuong}</td>
                <td className="text-end text-nowrap">
                  {tienViet.format(dong.thanhTien)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between fw-bold">
          <span>Tổng thanh toán</span>
          <span>{tienViet.format(bienLai.tongTien)}</span>
        </div>

        {bienLai.phuongThuc === 'TIEN_MAT' && (
          <>
            <div className="d-flex justify-content-between mt-1">
              <span>Khách đưa</span>
              <span>{tienViet.format(bienLai.tienKhachDua)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Tiền trả lại</span>
              <span>{tienViet.format(bienLai.tienTraLai)}</span>
            </div>
          </>
        )}

        <div className="d-flex gap-2 mt-4 pos-khong-in">
          <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onDong}>
            Đóng
          </button>
          <button type="button" className="btn btn-primary flex-fill" onClick={() => window.print()}>
            <Printer size={16} className="me-2" />
            In hóa đơn
          </button>
        </div>
      </article>
    </dialog>,
    document.body,
  )
}

export default function BanHangPage() {
  const [danhSach, setDanhSach] = useState<SanPham[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loiDanhSach, setLoiDanhSach] = useState('')
  const [moDanhSach, setMoDanhSach] = useState(false)
  const [tuKhoa, setTuKhoa] = useState('')

  const [moCamera, setMoCamera] = useState(true)
  const [dangTra, setDangTra] = useState(false)
  const [gioHang, setGioHang] = useState<DongGioHang[]>([])
  const [thongBao, setThongBao] = useState('')
  const [loi, setLoi] = useState('')

  const [soDienThoai, setSoDienThoai] = useState('')
  const [khachHang, setKhachHang] = useState<KhachHang | null>(null)
  const [dangTimKhach, setDangTimKhach] = useState(false)
  const [loiKhach, setLoiKhach] = useState('')

  const [phuongThuc, setPhuongThuc] = useState<PhuongThuc | null>(null)
  const [tienKhachDua, setTienKhachDua] = useState('')
  const [dangThuTien, setDangThuTien] = useState(false)
  const [choKiemTra, setChoKiemTra] = useState(false)
  const [loiThanhToan, setLoiThanhToan] = useState('')
  const [bienLai, setBienLai] = useState<BienLai | null>(null)
  const [moBienLai, setMoBienLai] = useState(false)

  const dangXuLyMa = useRef(false)
  const dangGuiPhieu = useRef(false)
  const phieuDangGui = useRef<PhieuThu | null>(null)
  const lanTimKhach = useRef(0)
  const amThanh = useRef<AudioContext | null>(null)

  const khoaGio = dangThuTien || choKiemTra
  const chuaChonKhach = Boolean(soDienThoai.trim()) && !khachHang

  useEffect(() => {
    const controller = new AbortController()

    async function taiSanPham() {
      try {
        const ds = await layDanhSachSanPham(controller.signal)
        if (!controller.signal.aborted) {
          setDanhSach(ds.filter((sp) => sp.trangThai === 'DANG_DUNG'))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoiDanhSach(
            error instanceof Error ? error.message : 'Không tải được danh sách sản phẩm.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setDangTai(false)
      }
    }

    void taiSanPham()

    return () => {
      controller.abort()
      lanTimKhach.current += 1
      if (amThanh.current) {
        void amThanh.current.close().catch(() => {})
        amThanh.current = null
      }
    }
  }, [])

  const tim = chuanHoa(tuKhoa)
  const ketQua = danhSach.filter((sp) =>
    [sp.tenSanPham, sp.maSanPham, sp.maVach ?? ''].some((giaTri) =>
      chuanHoa(giaTri).includes(tim),
    ),
  )

  const tongSoLuong = gioHang.reduce((tong, dong) => tong + dong.soLuong, 0)
  const tongTheoXu = gioHang.reduce((tong, dong) => tong + thanhTienTheoXu(dong), 0)
  const nhanTheoXu = docTienTheoXu(tienKhachDua)
  const duTien = nhanTheoXu !== null && nhanTheoXu >= tongTheoXu

  function doiSoDienThoai(value: string) {
    lanTimKhach.current += 1
    setSoDienThoai(value)
    setKhachHang(null)
    setDangTimKhach(false)
    setLoiKhach('')
    setLoiThanhToan('')
  }

  async function timKhachHang(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const sdt = soDienThoai.trim()
    if (!sdt || phieuDangGui.current) return

    const lan = ++lanTimKhach.current
    setDangTimKhach(true)
    setKhachHang(null)
    setLoiKhach('')

    try {
      const query = new URLSearchParams({ soDienThoai: sdt })
      const res = await fetch(`/api/ban-hang/khach-hang?${query}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      })

      if (!res.ok) throw new Error(`Không tra được khách hàng (HTTP ${res.status}).`)

      const ds: KhachHang[] = await res.json()
      if (lan !== lanTimKhach.current) return

      if (!ds.length) {
        setLoiKhach('Không tìm thấy khách. Kiểm tra số điện thoại hoặc chọn Khách lẻ.')
        return
      }

      setKhachHang(ds[0])
    } catch (error) {
      if (lan === lanTimKhach.current) {
        setLoiKhach(error instanceof Error ? error.message : 'Không tra được khách hàng.')
      }
    } finally {
      if (lan === lanTimKhach.current) setDangTimKhach(false)
    }
  }

  function chuanBiAmThanh() {
    try {
      if (!amThanh.current || amThanh.current.state === 'closed') {
        amThanh.current = new AudioContext()
      }
      if (amThanh.current.state === 'suspended') {
        void amThanh.current.resume().catch(() => {})
      }
    } catch {
      amThanh.current = null
    }
  }

  function phatAmThanhThanhCong() {
    const ctx = amThanh.current
    if (!ctx || ctx.state !== 'running') return

    try {
      const batDau = ctx.currentTime
      for (const [doTre, tanSo] of [[0, 660], [0.12, 880]]) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const t = batDau + doTre

        osc.type = 'sine'
        osc.frequency.value = tanSo
        gain.gain.setValueAtTime(0.001, t)
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.onended = () => {
          osc.disconnect()
          gain.disconnect()
        }
        osc.start(t)
        osc.stop(t + 0.17)
      }
    } catch {
      return
    }
  }

  const themSanPham = useCallback((sp: SanPham) => {
    if (phieuDangGui.current) return

    setGioHang((ds) => {
      if (!ds.some((dong) => dong.sanPham.id === sp.id)) {
        return [...ds, { sanPham: sp, soLuong: 1 }]
      }
      return ds.map((dong) =>
        dong.sanPham.id === sp.id
          ? { ...dong, soLuong: dong.soLuong + 1 }
          : dong,
      )
    })

    setLoi('')
    setLoiThanhToan('')
    setThongBao(`Đã thêm ${sp.tenSanPham}.`)
  }, [])

  const themTheoMaVach = useCallback(async (giaTri: string) => {
    const ma = giaTri.trim()
    if (!ma || dangXuLyMa.current || phieuDangGui.current) return false

    dangXuLyMa.current = true
    setDangTra(true)
    setLoi('')
    setThongBao('')

    try {
      const sp = await traSanPhamTheoMaVach(ma)
      if (sp.trangThai !== 'DANG_DUNG') {
        throw new Error(`${sp.tenSanPham} đang ngừng dùng.`)
      }
      themSanPham(sp)
    } catch (error) {
      setLoi(error instanceof Error ? error.message : 'Không tra được mã vạch.')
    } finally {
      dangXuLyMa.current = false
      setDangTra(false)
    }
    return true
  }, [themSanPham])

  async function nhanEnter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tim || dangXuLyMa.current || phieuDangGui.current) return

    const ma = tuKhoa.trim()
    const khopMa = danhSach.find((sp) =>
      sp.maVach === ma || sp.maSanPham.toLowerCase() === ma.toLowerCase(),
    )

    if (khopMa || ketQua.length === 1) {
      themSanPham(khopMa ?? ketQua[0])
      setTuKhoa('')
      return
    }

    if (ketQua.length > 1) {
      setMoDanhSach(true)
      setLoi('')
      setThongBao('Chọn sản phẩm cần thêm trong danh sách bên dưới.')
      return
    }

    await themTheoMaVach(ma)
  }

  function lamTrongGio() {
    setGioHang([])
    setPhuongThuc(null)
    setTienKhachDua('')
    setTuKhoa('')
    setThongBao('')
    setLoi('')
    doiSoDienThoai('')
  }

  function doiSoLuong(id: number, thayDoi: number) {
    if (phieuDangGui.current) return
    setThongBao('')
    setLoiThanhToan('')
    setGioHang((ds) =>
      ds.map((dong) =>
        dong.sanPham.id === id
          ? { ...dong, soLuong: Math.max(1, dong.soLuong + thayDoi) }
          : dong,
      ),
    )
  }

  function xoaDong(id: number) {
    if (phieuDangGui.current) return
    if (gioHang.length === 1) {
      lamTrongGio()
      return
    }
    setThongBao('')
    setLoiThanhToan('')
    setGioHang((ds) => ds.filter((dong) => dong.sanPham.id !== id))
  }

  function congMenhGia(menhGia: number) {
    setLoiThanhToan('')
    setTienKhachDua((cu) => {
      const hienTai = docTienTheoXu(cu)
      if (cu.trim() !== '' && hienTai === null) return cu
      const tong = (hienTai ?? 0) + menhGia * 100
      return Number.isSafeInteger(tong) ? String(tong / 100) : cu
    })
  }

  async function xacNhanThanhToan() {
    if (dangGuiPhieu.current || dangXuLyMa.current) return

    let phieu = phieuDangGui.current
    if (!phieu) {
      if (!phuongThuc || !gioHang.length || dangTimKhach || chuaChonKhach) return
      if (phuongThuc === 'TIEN_MAT' && !duTien) return

      if (phuongThuc === 'QR' && !window.confirm(
        `Bạn đã kiểm tra tài khoản cửa hàng và nhận đúng ${
          tienViet.format(tongTheoXu / 100)
        } cho hóa đơn này?`,
      )) return

      phieu = {
        maYeuCau: crypto.randomUUID(),
        phuongThuc,
        idKhachHang: khachHang?.id ?? null,
        tienKhachDua:
          phuongThuc === 'TIEN_MAT' && nhanTheoXu !== null ? nhanTheoXu / 100 : null,
        gioHang: gioHang.map(({ sanPham, soLuong }) => ({
          idSanPham: sanPham.id,
          donGia: sanPham.giaBan,
          soLuong,
        })),
      }
      phieuDangGui.current = phieu
    }

    chuanBiAmThanh()
    dangGuiPhieu.current = true
    setDangThuTien(true)
    setLoiThanhToan('')

    try {
      const url = phieu.phuongThuc === 'QR'
        ? '/api/ban-hang/qr'
        : '/api/ban-hang/tien-mat'

      const res = await guiYeuCauGhi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maYeuCau: phieu.maYeuCau,
          idKhachHang: phieu.idKhachHang,
          tienKhachDua: phieu.tienKhachDua,
          gioHang: phieu.gioHang,
        }),
      })

      if (!res.ok) {
        const loiHttp: Record<number, string> = {
          400: 'Dữ liệu thanh toán chưa hợp lệ.',
          401: 'Phiên đăng nhập đã hết hạn.',
          403: 'Yêu cầu bị từ chối. Kiểm tra quyền Thu ngân và phiên đăng nhập.',
          404: 'Không tìm thấy API thanh toán.',
          409: 'Kiểm tra khách hàng, phiên thu ngân và tồn kho.',
        }

        if (!loiHttp[res.status]) throw new Error(`HTTP ${res.status}`)

        const duLieu = await res.json().catch(() => null)
        setLoiThanhToan(
          typeof duLieu?.thongBao === 'string'
            ? duLieu.thongBao
            : loiHttp[res.status],
        )

        if (!choKiemTra) phieuDangGui.current = null
        return
      }

      const ketQuaThu: unknown = await res.json()
      if (!laBienLai(ketQuaThu) || ketQuaThu.phuongThuc !== phieu.phuongThuc) {
        throw new Error('Biên lai trả về chưa hợp lệ.')
      }

      phieuDangGui.current = null
      setChoKiemTra(false)
      lamTrongGio()
      setBienLai(ketQuaThu)
      phatAmThanhThanhCong()
      setMoBienLai(true)
    } catch {
      setChoKiemTra(true)
      setLoiThanhToan(
        'Chưa nhận được biên lai. Giữ trang mở và bấm “Kiểm tra lại thanh toán”.',
      )
    } finally {
      dangGuiPhieu.current = false
      setDangThuTien(false)
    }
  }

  return (
    <section className="container-fluid p-3 p-lg-4 text-start">
      <h1 className="h3 fw-bold mb-3">Bán hàng tại quầy</h1>

      <div className="row g-3 align-items-start">
        <div className="col-12 col-lg-7">
          <section className="card rounded-3 shadow-sm p-3 p-xl-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-semibold mb-0">Sản phẩm</h2>
              {!moCamera && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  disabled={khoaGio}
                  onClick={() => setMoCamera(true)}
                >
                  Bật camera
                </button>
              )}
            </div>

            <form className="input-group" onSubmit={nhanEnter}>
              <span className="input-group-text bg-white">
                <Search size={17} aria-hidden="true" />
              </span>
              <input
                type="search"
                className="form-control"
                aria-label="Tìm sản phẩm"
                placeholder="Tìm tên, mã sản phẩm hoặc nhập mã vạch"
                value={tuKhoa}
                disabled={khoaGio}
                autoComplete="off"
                onChange={(e) => setTuKhoa(e.target.value)}
              />
              <button className="btn btn-primary" disabled={khoaGio || dangTra || !tim}>
                {dangTra ? 'Đang tra…' : 'Thêm'}
              </button>
            </form>

            {moCamera && !moBienLai && (
              <QuetMaVach
                lienTuc
                onDong={() => setMoCamera(false)}
                onQuetDuoc={themTheoMaVach}
              />
            )}

            {thongBao && <div role="status" className="small text-success mt-2">{thongBao}</div>}
            {loi && <div role="alert" className="small text-danger mt-2">{loi}</div>}

            <button
              type="button"
              className="btn btn-light border d-flex justify-content-between mt-3"
              aria-expanded={moDanhSach}
              aria-controls="pos-danh-sach"
              onClick={() => setMoDanhSach((cu) => !cu)}
            >
              <strong>Danh sách sản phẩm</strong>
              <span>
                {moDanhSach ? 'Thu gọn' : 'Mở danh sách'}
                {!dangTai && !loiDanhSach && ` (${ketQua.length})`}
              </span>
            </button>

            <div
              id="pos-danh-sach"
              hidden={!moDanhSach}
              className="overflow-auto"
              style={{ maxHeight: '42vh' }}
            >
              {dangTai && <p className="small mt-2">Đang tải sản phẩm…</p>}
              {loiDanhSach && <p className="small text-danger mt-2" role="alert">{loiDanhSach}</p>}
              {!dangTai && !loiDanhSach && !ketQua.length && (
                <p className="small mt-2">Không tìm thấy sản phẩm.</p>
              )}

              {ketQua.map((sp) => (
                <div
                  key={sp.id}
                  className="d-flex justify-content-between align-items-center gap-2 border-bottom py-2"
                >
                  <div>
                    <strong>{sp.tenSanPham}</strong>
                    <div className="small text-secondary">
                      {sp.maSanPham} · {tienViet.format(sp.giaBan)} / {sp.donViTinh}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    disabled={khoaGio}
                    onClick={() => themSanPham(sp)}
                  >
                    Thêm
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <aside className="card rounded-3 shadow-sm p-3 p-xl-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 fw-semibold mb-0">
                <ShoppingCart size={20} className="text-primary me-2" />
                Giỏ hàng
              </h2>
              {gioHang.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={khoaGio || dangTra}
                  onClick={() => {
                    if (window.confirm('Xóa toàn bộ sản phẩm trong giỏ hiện tại?')) {
                      lamTrongGio()
                    }
                  }}
                >
                  Hủy giỏ
                </button>
              )}
            </div>

            {bienLai && (
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 px-2 py-2 mb-3">
                <span className="small">
                  Hóa đơn gần nhất: <strong>{tienViet.format(bienLai.tongTien)}</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success"
                  disabled={khoaGio || dangTra}
                  onClick={() => setMoBienLai(true)}
                >
                  Xem / in lại
                </button>
              </div>
            )}

            {gioHang.length === 0 && (
              <p className="small text-secondary">Quét mã hoặc chọn sản phẩm để bắt đầu.</p>
            )}

            <div className="overflow-auto" style={{ maxHeight: '32vh' }}>
              {gioHang.map((dong) => {
                const sp = dong.sanPham

                return (
                  <div key={sp.id} className="border-bottom py-2">
                    <div className="d-flex justify-content-between gap-2">
                      <strong>{sp.tenSanPham}</strong>
                      <strong className="text-nowrap">
                        {tienViet.format(thanhTienTheoXu(dong) / 100)}
                      </strong>
                    </div>
                    <div className="small text-secondary">
                      {tienViet.format(sp.giaBan)} / {sp.donViTinh}
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <button
                        type="button"
                        aria-label={`Giảm ${sp.tenSanPham}`}
                        className="btn btn-sm btn-outline-secondary"
                        disabled={khoaGio || dong.soLuong <= 1}
                        onClick={() => doiSoLuong(sp.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{dong.soLuong}</span>
                      <button
                        type="button"
                        aria-label={`Tăng ${sp.tenSanPham}`}
                        className="btn btn-sm btn-outline-secondary"
                        disabled={khoaGio}
                        onClick={() => doiSoLuong(sp.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Xóa ${sp.tenSanPham}`}
                        className="btn btn-sm text-danger ms-auto"
                        disabled={khoaGio}
                        onClick={() => xoaDong(sp.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="d-flex justify-content-between small text-secondary mt-3">
              <span>Số mặt hàng: {gioHang.length}</span>
              <span>Tổng số lượng: {tongSoLuong}</span>
            </div>

            <div className="d-flex justify-content-between bg-primary bg-opacity-10 rounded-3 p-3 mt-2">
              <strong>Tổng tiền hàng</strong>
              <strong className="text-primary">{tienViet.format(tongTheoXu / 100)}</strong>
            </div>

            {gioHang.length > 0 && (
              <>
                <fieldset disabled={khoaGio} className="mt-3">
                  <legend className="h6">Khách hàng</legend>
                  <form onSubmit={timKhachHang}>
                    <label htmlFor="pos-sdt-khach" className="form-label small mb-1">
                      Số điện thoại thành viên
                    </label>
                    <div className="input-group">
                      <input
                        id="pos-sdt-khach"
                        type="tel"
                        className="form-control"
                        maxLength={20}
                        placeholder="Để trống nếu là khách lẻ"
                        value={soDienThoai}
                        onChange={(e) => doiSoDienThoai(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-outline-primary"
                        disabled={dangTimKhach || !soDienThoai.trim()}
                      >
                        {dangTimKhach ? 'Đang tìm…' : 'Tìm khách'}
                      </button>
                    </div>
                  </form>
                  <div className="d-flex justify-content-between align-items-center gap-2 mt-1">
                    <span className="small" role="status">
                      {khachHang
                        ? `Thành viên: ${khachHang.hoTen}`
                        : chuaChonKhach ? 'Bấm Tìm khách để chọn thành viên.' : 'Khách lẻ'}
                    </span>
                    {soDienThoai.trim() && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        onClick={() => doiSoDienThoai('')}
                      >
                        Chọn khách lẻ
                      </button>
                    )}
                  </div>
                  {loiKhach && <div className="small text-danger" role="alert">{loiKhach}</div>}
                </fieldset>

                <fieldset disabled={khoaGio} className="mt-3">
                  <legend className="h6">Phương thức thanh toán</legend>
                  <div className="d-flex gap-2">
                    {cacPhuongThuc.map((pt) => (
                      <div key={pt} className="flex-fill">
                        <input
                          type="radio"
                          className="btn-check"
                          name="pos-phuong-thuc"
                          id={`pos-${pt}`}
                          checked={phuongThuc === pt}
                          onChange={() => {
                            setPhuongThuc(pt)
                            setLoiThanhToan('')
                          }}
                        />
                        <label htmlFor={`pos-${pt}`} className="btn btn-outline-primary w-100">
                          {tenPhuongThuc[pt]}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>

                {phuongThuc === 'TIEN_MAT' && (
                  <fieldset disabled={khoaGio} className="mt-3">
                    <label htmlFor="pos-tien-khach-dua" className="form-label">Tiền khách đưa</label>
                    <div className="input-group">
                      <input
                        id="pos-tien-khach-dua"
                        className="form-control"
                        inputMode="decimal"
                        placeholder="Nhập số tiền"
                        value={tienKhachDua}
                        onChange={(e) => {
                          setTienKhachDua(e.target.value)
                          setLoiThanhToan('')
                        }}
                      />
                      <span className="input-group-text">đ</span>
                    </div>
                    {tienKhachDua !== '' && nhanTheoXu === null && (
                      <small className="text-danger">Nhập số tiền bằng chữ số, ví dụ 50000.</small>
                    )}

                    <p className="small text-secondary mt-2 mb-1">Cộng theo mệnh giá</p>
                    <div className="row row-cols-3 g-1">
                      {menhGiaViet.map((menhGia) => (
                        <div className="col d-grid" key={menhGia}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={tienKhachDua.trim() !== '' && nhanTheoXu === null}
                            onClick={() => congMenhGia(menhGia)}
                          >
                            +{menhGia.toLocaleString('vi-VN')} đ
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex gap-2 mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setTienKhachDua(String(tongTheoXu / 100))
                          setLoiThanhToan('')
                        }}
                      >
                        Khách đưa vừa đủ
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link"
                        onClick={() => {
                          setTienKhachDua('')
                          setLoiThanhToan('')
                        }}
                      >
                        Nhập lại
                      </button>
                    </div>

                    {nhanTheoXu !== null && (
                      <div className="d-flex justify-content-between mt-2" role="status">
                        <span>{duTien ? 'Tiền trả lại' : 'Còn thiếu'}</span>
                        <strong className={duTien ? 'text-success' : 'text-danger'}>
                          {tienViet.format(Math.abs(nhanTheoXu - tongTheoXu) / 100)}
                        </strong>
                      </div>
                    )}
                  </fieldset>
                )}

                {phuongThuc === 'QR' && (
                  <div className="bg-light border rounded-3 p-3 mt-3">
                    <strong>Số tiền cần chuyển: {tienViet.format(tongTheoXu / 100)}</strong>
                    <div className="small mt-1">
                      Khách quét mã QR tại quầy. Kiểm tra tiền đã vào tài khoản trước khi xác nhận.
                    </div>
                  </div>
                )}

                {loiThanhToan && (
                  <div role="alert" className="alert alert-danger small mt-2 mb-0">
                    {loiThanhToan}
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary fw-semibold mt-3"
                  onClick={() => void xacNhanThanhToan()}
                  disabled={
                    dangThuTien || dangTra ||
                    (!choKiemTra && (
                      dangTimKhach || chuaChonKhach || !phuongThuc ||
                      (phuongThuc === 'TIEN_MAT' && !duTien)
                    ))
                  }
                >
                  {dangThuTien
                    ? 'Đang xác nhận…'
                    : choKiemTra
                      ? 'Kiểm tra lại thanh toán'
                      : phuongThuc === 'QR'
                        ? 'Xác nhận đã nhận chuyển khoản'
                        : 'Xác nhận thanh toán'}
                </button>
              </>
            )}
          </aside>
        </div>
      </div>

      {moBienLai && bienLai && (
        <CuaSoBienLai bienLai={bienLai} onDong={() => setMoBienLai(false)} />
      )}
    </section>
  )
}