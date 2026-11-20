
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
  diemHienCo: number
}

type KhuyenMai = {
  id: number
  tenChuongTrinh: string
  loaiGiamGia: 'PHAN_TRAM' | 'SO_TIEN'
  giaTriGiam: number
  hoaDonToiThieu: number | null
  giamToiDa: number | null
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
  soDiemSuDung: number
  idChuongTrinhKhuyenMai: number | null
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
  tongTienHang: number
  tongGiamGia: number
  tienGiamTuDiem: number
  soDiemSuDung: number
  soDiemDuocCong: number
  tenChuongTrinh: string
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
    Number.isFinite(v.tongTienHang) &&
    Number.isFinite(v.tongGiamGia) &&
    Number.isFinite(v.tienGiamTuDiem) &&
    Number.isInteger(v.soDiemSuDung) &&
    Number.isInteger(v.soDiemDuocCong) &&
    typeof v.tenChuongTrinh === 'string' &&
    Number.isFinite(v.tienKhachDua) &&
    Number.isFinite(v.tienTraLai) &&
    Array.isArray(v.chiTiet) &&
    v.chiTiet.length > 0 &&
    v.chiTiet.every((d) =>
      d && typeof d.tenSanPham === 'string' &&
      Number.isInteger(d.soLuong) && d.soLuong > 0 &&
      Number.isFinite(d.donGia) &&
      Number.isFinite(d.thanhTien),
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

  const giamKhuyenMai = Math.max(
    0,
    bienLai.tongGiamGia - bienLai.tienGiamTuDiem,
  )

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
        .pos-bien-lai::backdrop {
          background: rgba(15, 23, 42, .45);
        }
        @media print {
          body > :not(.pos-bien-lai) {
            display: none !important;
          }
          body {
            margin: 0 !important;
            background: white !important;
          }
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
          .pos-bien-lai::backdrop {
            background: transparent;
          }
          .pos-bien-lai .pos-khong-in {
            display: none !important;
          }
          .pos-bien-lai article {
            padding: 3mm !important;
          }
          .pos-bien-lai tr {
            break-inside: avoid;
          }
        }
      `}</style>

      <article className="p-4">
        <p className="text-success fw-semibold text-center mb-1 pos-khong-in">
          Thanh toán thành công
        </p>

        <h2 id="pos-tieu-de-bien-lai" className="h4 text-center mb-1">
          Hóa đơn bán hàng
        </h2>

        <p className="text-center fw-semibold mb-3">
          {bienLai.tenChiNhanh}
        </p>

        <div className="small text-break">
          Số hóa đơn: {bienLai.soHoaDon}
        </div>
        <div className="small">Thời gian: {bienLai.thoiGian}</div>
        <div className="small">Thu ngân: {bienLai.tenThuNgan}</div>
        <div className="small">Khách hàng: {bienLai.tenKhachHang}</div>
        <div className="small">
          Phương thức: {tenPhuongThuc[bienLai.phuongThuc]}
        </div>

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

        <div className="d-flex justify-content-between">
          <span>Tổng tiền hàng</span>
          <span>{tienViet.format(bienLai.tongTienHang)}</span>
        </div>

        {bienLai.tenChuongTrinh && (
          <div className="small text-secondary mt-2">
            Khuyến mãi: {bienLai.tenChuongTrinh}
          </div>
        )}

        <div className="d-flex justify-content-between mt-1">
          <span>Giảm khuyến mãi</span>
          <span>-{tienViet.format(giamKhuyenMai)}</span>
        </div>

        <div className="d-flex justify-content-between mt-1">
          <span>Giảm từ điểm</span>
          <span>-{tienViet.format(bienLai.tienGiamTuDiem)}</span>
        </div>

        <hr />

        <div className="d-flex justify-content-between fw-bold">
          <span>Khách phải thanh toán</span>
          <span>{tienViet.format(bienLai.tongTien)}</span>
        </div>

        {bienLai.phuongThuc === 'TIEN_MAT' && (
          <>
            <div className="d-flex justify-content-between mt-2">
              <span>Khách đưa</span>
              <span>{tienViet.format(bienLai.tienKhachDua)}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Tiền trả lại</span>
              <span>{tienViet.format(bienLai.tienTraLai)}</span>
            </div>
          </>
        )}

        {(bienLai.soDiemSuDung > 0 || bienLai.soDiemDuocCong > 0) && (
          <div className="border-top mt-3 pt-2 small">
            {bienLai.soDiemSuDung > 0 && (
              <div className="d-flex justify-content-between">
                <span>Điểm đã sử dụng</span>
                <strong>{bienLai.soDiemSuDung}</strong>
              </div>
            )}
            {bienLai.soDiemDuocCong > 0 && (
              <div className="d-flex justify-content-between text-success">
                <span>Điểm được tích lũy</span>
                <strong>+{bienLai.soDiemDuocCong}</strong>
              </div>
            )}
          </div>
        )}

        <div className="d-flex gap-2 mt-4 pos-khong-in">
          <button
            type="button"
            className="btn btn-outline-secondary flex-fill"
            onClick={onDong}
          >
            Đóng
          </button>
          <button
            type="button"
            className="btn btn-primary flex-fill"
            onClick={() => window.print()}
          >
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
  const [moUuDai, setMoUuDai] = useState(false)
  const [moMenhGia, setMoMenhGia] = useState(false)
  const [dangTra, setDangTra] = useState(false)
  const [gioHang, setGioHang] = useState<DongGioHang[]>([])
  const [thongBao, setThongBao] = useState('')
  const [loi, setLoi] = useState('')

  const [soDienThoai, setSoDienThoai] = useState('')
  const [khachHang, setKhachHang] = useState<KhachHang | null>(null)
  const [dangTimKhach, setDangTimKhach] = useState(false)
  const [loiKhach, setLoiKhach] = useState('')

  const [danhSachKhuyenMai, setDanhSachKhuyenMai] = useState<KhuyenMai[]>([])
  const [daTaiKhuyenMai, setDaTaiKhuyenMai] = useState(false)
  const [soDiemSuDung, setSoDiemSuDung] = useState('0')
  const [loiKhuyenMai, setLoiKhuyenMai] = useState('')

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
            error instanceof Error
              ? error.message
              : 'Không tải được danh sách sản phẩm.',
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

  useEffect(() => {
    const controller = new AbortController()

    async function taiKhuyenMai() {
      try {
        const response = await fetch('/api/ban-hang/khuyen-mai', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            `Không tải được khuyến mãi (HTTP ${response.status}).`,
          )
        }

        const ds: KhuyenMai[] = await response.json()

        if (!controller.signal.aborted) {
          setDanhSachKhuyenMai(ds)
          setLoiKhuyenMai('')
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoiKhuyenMai(
            error instanceof Error
              ? error.message
              : 'Không tải được khuyến mãi.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setDaTaiKhuyenMai(true)
      }
    }

    void taiKhuyenMai()

    return () => controller.abort()
  }, [])

  const tim = chuanHoa(tuKhoa)

  const ketQua = danhSach.filter((sp) =>
    [sp.tenSanPham, sp.maSanPham, sp.maVach ?? ''].some((giaTri) =>
      chuanHoa(giaTri).includes(tim),
    ),
  )

  const tongSoLuong = gioHang.reduce(
    (tong, dong) => tong + dong.soLuong,
    0,
  )

  const tongTheoXu = gioHang.reduce(
    (tong, dong) => tong + thanhTienTheoXu(dong),
    0,
  )

  let khuyenMaiChon: KhuyenMai | null = null
  let giamKhuyenMaiTheoXu = 0

  for (const km of danhSachKhuyenMai) {
    if (
      km.hoaDonToiThieu !== null &&
      tongTheoXu / 100 < km.hoaDonToiThieu
    ) continue

    let mucGiam = km.loaiGiamGia === 'PHAN_TRAM'
      ? Math.round(tongTheoXu * km.giaTriGiam / 100)
      : Math.round(km.giaTriGiam * 100)

    if (km.giamToiDa !== null) {
      mucGiam = Math.min(mucGiam, Math.round(km.giamToiDa * 100))
    }
    mucGiam = Math.min(mucGiam, tongTheoXu)

    if (
      mucGiam > giamKhuyenMaiTheoXu ||
      (mucGiam > 0 && mucGiam === giamKhuyenMaiTheoXu &&
        (khuyenMaiChon === null || km.id < khuyenMaiChon.id))
    ) {
      khuyenMaiChon = km
      giamKhuyenMaiTheoXu = mucGiam
    }
  }

  const idKhuyenMai = khuyenMaiChon?.id ?? null
  const diemNhapHopLe =
    /^\d+$/.test(soDiemSuDung) &&
    Number.isSafeInteger(Number(soDiemSuDung))

  const diemSuDung = diemNhapHopLe
    ? Number(soDiemSuDung)
    : 0

  const giamDiemTheoXu = diemSuDung * 10000

  const diemHopLe =
    diemNhapHopLe &&
    Number.isSafeInteger(giamDiemTheoXu) &&
    (
      diemSuDung === 0 ||
      (
        khachHang !== null &&
        diemSuDung <= khachHang.diemHienCo &&
        giamDiemTheoXu <= tongTheoXu - giamKhuyenMaiTheoXu
      )
    )

  const khuyenMaiHopLe = daTaiKhuyenMai && !loiKhuyenMai

  const giamDiemApDungTheoXu = diemHopLe
    ? giamDiemTheoXu
    : 0

  const tongThanhToanTheoXu = Math.max(
    0,
    tongTheoXu -
      giamKhuyenMaiTheoXu -
      giamDiemApDungTheoXu,
  )

  const nhanTheoXu = docTienTheoXu(tienKhachDua)

  const duTien =
    nhanTheoXu !== null &&
    nhanTheoXu >= tongThanhToanTheoXu

  function doiSoDienThoai(value: string) {
    lanTimKhach.current += 1
    setSoDienThoai(value)
    setKhachHang(null)
    setSoDiemSuDung('0')
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
    setSoDiemSuDung('0')
    setLoiKhach('')

    try {
      const query = new URLSearchParams({
        soDienThoai: sdt,
      })

      const res = await fetch(
        `/api/ban-hang/khach-hang?${query}`,
        {
          credentials: 'same-origin',
          cache: 'no-store',
        },
      )

      if (!res.ok) {
        throw new Error(
          `Không tra được khách hàng (HTTP ${res.status}).`,
        )
      }

      const ds: KhachHang[] = await res.json()

      if (lan !== lanTimKhach.current) return

      if (!ds.length) {
        setLoiKhach(
          'Không tìm thấy khách. Kiểm tra số điện thoại hoặc chọn Khách lẻ.',
        )
        return
      }

      setKhachHang(ds[0])
    } catch (error) {
      if (lan === lanTimKhach.current) {
        setLoiKhach(
          error instanceof Error
            ? error.message
            : 'Không tra được khách hàng.',
        )
      }
    } finally {
      if (lan === lanTimKhach.current) {
        setDangTimKhach(false)
      }
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

    if (!ma || dangXuLyMa.current || phieuDangGui.current) {
      return false
    }

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
      setLoi(
        error instanceof Error
          ? error.message
          : 'Không tra được mã vạch.',
      )
    } finally {
      dangXuLyMa.current = false
      setDangTra(false)
    }

    return true
  }, [themSanPham])

  async function nhanEnter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!tim || dangXuLyMa.current || phieuDangGui.current) {
      return
    }

    const ma = tuKhoa.trim()

    const khopMa = danhSach.find((sp) =>
      sp.maVach === ma ||
      sp.maSanPham.toLowerCase() === ma.toLowerCase(),
    )

    if (khopMa || ketQua.length === 1) {
      themSanPham(khopMa ?? ketQua[0])
      setTuKhoa('')
      return
    }

    if (ketQua.length > 1) {
      setMoDanhSach(true)
      setLoi('')
      setThongBao(
        'Chọn sản phẩm cần thêm trong danh sách bên dưới.',
      )
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
    setSoDiemSuDung('0')
    setMoUuDai(false)
    setMoMenhGia(false)
    doiSoDienThoai('')
  }

  function doiSoLuong(id: number, thayDoi: number) {
    if (phieuDangGui.current) return

    setThongBao('')
    setLoiThanhToan('')

    setGioHang((ds) =>
      ds.map((dong) =>
        dong.sanPham.id === id
          ? {
              ...dong,
              soLuong: Math.max(1, dong.soLuong + thayDoi),
            }
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

      if (cu.trim() !== '' && hienTai === null) {
        return cu
      }

      const tong = (hienTai ?? 0) + menhGia * 100

      return Number.isSafeInteger(tong)
        ? String(tong / 100)
        : cu
    })
  }

  async function xacNhanThanhToan() {
    if (dangGuiPhieu.current || dangXuLyMa.current) return

    let phieu = phieuDangGui.current

    if (!phieu) {
      if (
        !phuongThuc ||
        !gioHang.length ||
        dangTimKhach ||
        chuaChonKhach ||
        !diemHopLe ||
        !khuyenMaiHopLe
      ) {
        return
      }

      if (phuongThuc === 'TIEN_MAT' && !duTien) {
        return
      }

      if (
        phuongThuc === 'QR' &&
        !window.confirm(
          `Bạn đã kiểm tra tài khoản cửa hàng và nhận đúng ${
            tienViet.format(tongThanhToanTheoXu / 100)
          } cho hóa đơn này?`,
        )
      ) {
        return
      }

      phieu = {
        maYeuCau: crypto.randomUUID(),
        phuongThuc,
        idKhachHang: khachHang?.id ?? null,
        tienKhachDua:
          phuongThuc === 'TIEN_MAT' && nhanTheoXu !== null
            ? nhanTheoXu / 100
            : null,
        soDiemSuDung: diemSuDung,
        idChuongTrinhKhuyenMai: idKhuyenMai,
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maYeuCau: phieu.maYeuCau,
          idKhachHang: phieu.idKhachHang,
          tienKhachDua: phieu.tienKhachDua,
          soDiemSuDung: phieu.soDiemSuDung,
          idChuongTrinhKhuyenMai: phieu.idChuongTrinhKhuyenMai,
          gioHang: phieu.gioHang,
        }),
      })

      if (!res.ok) {
        const loiHttp: Record<number, string> = {
          400: 'Dữ liệu thanh toán chưa hợp lệ.',
          401: 'Phiên đăng nhập đã hết hạn.',
          403: 'Yêu cầu bị từ chối. Kiểm tra quyền Thu ngân và phiên đăng nhập.',
          404: 'Không tìm thấy API thanh toán.',
          409: 'Kiểm tra khách hàng, điểm thành viên, khuyến mãi, phiên thu ngân và tồn kho.',
        }

        if (!loiHttp[res.status]) {
          throw new Error(`HTTP ${res.status}`)
        }

        const duLieu = await res.json().catch(() => null)

        setLoiThanhToan(
          typeof duLieu?.thongBao === 'string'
            ? duLieu.thongBao
            : loiHttp[res.status],
        )

        if (!choKiemTra) {
          phieuDangGui.current = null
        }

        return
      }

      const ketQuaThu: unknown = await res.json()

      if (
        !laBienLai(ketQuaThu) ||
        ketQuaThu.phuongThuc !== phieu.phuongThuc
      ) {
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
    <section className="container-fluid p-2 p-lg-3 text-start pos-page">
      <style>{`
        .pos-page .pos-payment-card {
          position: sticky;
          top: .75rem;
          max-height: calc(100dvh - 1.5rem);
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }
        .pos-page .pos-cart-list {
          max-height: clamp(100px, 18vh, 180px);
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
        }
        .pos-page .form-control,
        .pos-page .form-select {
          min-height: 36px;
          padding-top: .35rem;
          padding-bottom: .35rem;
        }
        .pos-page .pos-payment-card .btn {
          min-height: 34px;
        }
        .pos-page .pos-payment-submit {
          position: sticky;
          bottom: -1px;
          z-index: 3;
          background: #fff;
          padding-top: .6rem;
          margin-top: .6rem;
          box-shadow: 0 -8px 12px rgba(255,255,255,.96);
        }
        .pos-page .pos-summary {
          font-size: .9rem;
          line-height: 1.35;
        }
        @media (max-width: 991.98px) {
          .pos-page .pos-payment-card {
            position: static;
            max-height: none;
            overflow: visible;
          }
          .pos-page .pos-cart-list {
            max-height: 32vh;
          }
        }
        @media (min-width: 992px) and (max-height: 760px) {
          .pos-page .pos-cart-list {
            max-height: 14vh;
          }
          .pos-page .pos-payment-card {
            padding: .7rem !important;
          }
          .pos-page .pos-payment-card .pos-section-gap {
            margin-top: .55rem !important;
          }
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1 className="h4 fw-bold mb-0">Bán hàng tại quầy</h1>
        <span className="small text-secondary">POS</span>
      </div>

      <div className="row g-2 align-items-start">
        <div className="col-12 col-lg-7">
          <section className="card rounded-3 shadow-sm p-2 p-xl-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="h6 fw-semibold mb-0">Sản phẩm</h2>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                disabled={khoaGio}
                onClick={() => setMoCamera((cu) => !cu)}
              >
                {moCamera ? 'Đóng máy quét' : 'Mở máy quét'}
              </button>
            </div>

            <form className="input-group" onSubmit={nhanEnter}>
              <span className="input-group-text bg-white">
                <Search size={17} aria-hidden="true" />
              </span>
              <input
                type="search"
                className="form-control"
                aria-label="Tìm sản phẩm"
                placeholder="Tên, mã sản phẩm hoặc mã vạch"
                value={tuKhoa}
                disabled={khoaGio}
                autoComplete="off"
                onChange={(e) => setTuKhoa(e.target.value)}
              />
              <button
                className="btn btn-primary"
                disabled={khoaGio || dangTra || !tim}
              >
                {dangTra ? 'Đang tra…' : 'Thêm'}
              </button>
            </form>

            {moCamera && !moBienLai && (
              <div className="mt-2">
                <QuetMaVach
                  lienTuc
                  onDong={() => setMoCamera(false)}
                  onQuetDuoc={themTheoMaVach}
                />
              </div>
            )}

            {thongBao && (
              <div role="status" className="small text-success mt-2">
                {thongBao}
              </div>
            )}
            {loi && (
              <div role="alert" className="small text-danger mt-2">
                {loi}
              </div>
            )}

            <button
              type="button"
              className="btn btn-light border d-flex justify-content-between align-items-center w-100 mt-2"
              aria-expanded={moDanhSach}
              aria-controls="pos-danh-sach"
              onClick={() => setMoDanhSach((cu) => !cu)}
            >
              <strong className="small">Danh sách sản phẩm</strong>
              <span className="small">
                {moDanhSach ? 'Thu gọn' : 'Mở danh sách'}
                {!dangTai && !loiDanhSach && ` (${ketQua.length})`}
              </span>
            </button>

            <div
              id="pos-danh-sach"
              hidden={!moDanhSach}
              className="overflow-auto"
              style={{ maxHeight: '48vh' }}
            >
              {dangTai && (
                <p className="small mt-2 mb-1">Đang tải sản phẩm…</p>
              )}
              {loiDanhSach && (
                <p className="small text-danger mt-2 mb-1" role="alert">
                  {loiDanhSach}
                </p>
              )}
              {!dangTai && !loiDanhSach && !ketQua.length && (
                <p className="small mt-2 mb-1">
                  Không tìm thấy sản phẩm.
                </p>
              )}

              {ketQua.map((sp) => (
                <div
                  key={sp.id}
                  className="d-flex justify-content-between align-items-center gap-2 border-bottom py-2"
                >
                  <div style={{ minWidth: 0 }}>
                    <strong className="small">{sp.tenSanPham}</strong>
                    <div className="small text-secondary">
                      {sp.maSanPham} · {tienViet.format(sp.giaBan)} / {sp.donViTinh}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary flex-shrink-0"
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
          <aside className="card rounded-3 shadow-sm p-2 p-xl-3 pos-payment-card">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="h6 fw-semibold mb-0">
                <ShoppingCart size={18} className="text-primary me-2" />
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
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 px-2 py-1 mb-2">
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
              <p className="small text-secondary mb-2">
                Quét mã hoặc chọn sản phẩm để bắt đầu.
              </p>
            )}

            <div className="pos-cart-list">
              {gioHang.map((dong) => {
                const sp = dong.sanPham

                return (
                  <div key={sp.id} className="border-bottom py-2">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div style={{ minWidth: 0 }}>
                        <strong className="small">{sp.tenSanPham}</strong>
                        <div className="small text-secondary">
                          {tienViet.format(sp.giaBan)} / {sp.donViTinh}
                        </div>
                      </div>
                      <strong className="small text-nowrap">
                        {tienViet.format(thanhTienTheoXu(dong) / 100)}
                      </strong>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <button
                        type="button"
                        aria-label={`Giảm ${sp.tenSanPham}`}
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        disabled={khoaGio || dong.soLuong <= 1}
                        onClick={() => doiSoLuong(sp.id, -1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span className="small">{dong.soLuong}</span>
                      <button
                        type="button"
                        aria-label={`Tăng ${sp.tenSanPham}`}
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        disabled={khoaGio}
                        onClick={() => doiSoLuong(sp.id, 1)}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Xóa ${sp.tenSanPham}`}
                        className="btn btn-sm text-danger ms-auto py-0 px-2"
                        disabled={khoaGio}
                        onClick={() => xoaDong(sp.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {gioHang.length > 0 && (
              <>
                <div className="d-flex justify-content-between small text-secondary mt-2">
                  <span>{gioHang.length} mặt hàng · {tongSoLuong} sản phẩm</span>
                  <span>{tienViet.format(tongTheoXu / 100)}</span>
                </div>

                <fieldset disabled={khoaGio} className="border-0 p-0 m-0 pos-section-gap mt-2">
                  <legend className="small fw-semibold mb-1">Khách hàng</legend>
                  <form onSubmit={timKhachHang}>
                    <div className="input-group input-group-sm">
                      <input
                        id="pos-sdt-khach"
                        type="tel"
                        className="form-control"
                        maxLength={20}
                        aria-label="Số điện thoại khách hàng"
                        placeholder="Số điện thoại thành viên (bỏ trống = khách lẻ)"
                        value={soDienThoai}
                        onChange={(e) => doiSoDienThoai(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-outline-primary"
                        disabled={dangTimKhach || !soDienThoai.trim()}
                      >
                        {dangTimKhach ? 'Đang tìm…' : 'Tìm'}
                      </button>
                    </div>
                  </form>

                  <div className="d-flex justify-content-between align-items-center gap-2 mt-1">
                    <span className="small text-secondary" role="status">
                      {khachHang
                        ? `${khachHang.hoTen} · ${khachHang.diemHienCo.toLocaleString('vi-VN')} điểm`
                        : chuaChonKhach
                          ? 'Chưa xác nhận khách hàng'
                          : 'Khách lẻ'}
                    </span>
                    {soDienThoai.trim() && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link py-0"
                        onClick={() => doiSoDienThoai('')}
                      >
                        Khách lẻ
                      </button>
                    )}
                  </div>
                  {loiKhach && (
                    <div className="small text-danger" role="alert">
                      {loiKhach}
                    </div>
                  )}
                </fieldset>

                <div className="pos-section-gap mt-2">
                  <button
                    type="button"
                    className="btn btn-light border w-100 d-flex justify-content-between align-items-center text-start py-1"
                    aria-expanded={moUuDai}
                    aria-controls="pos-uu-dai"
                    disabled={khoaGio}
                    onClick={() => setMoUuDai((cu) => !cu)}
                  >
                    <span className="small fw-semibold">
                      Khuyến mãi & điểm thành viên
                    </span>
                    <span className="small text-primary">
                      {moUuDai
                        ? 'Thu gọn'
                        : !diemHopLe || !khuyenMaiHopLe
                          ? 'Kiểm tra'
                          : khuyenMaiChon || diemSuDung > 0
                            ? 'Đang áp dụng'
                            : 'Mở'}
                    </span>
                  </button>

                  <div
                    id="pos-uu-dai"
                    hidden={!moUuDai}
                    className="border rounded-3 p-2 mt-2"
                  >
                    <div className="row g-2 align-items-end">
                      <div className="col-12 col-md-7">
                        <label className="form-label small mb-1">
                          Chương trình khuyến mãi tốt nhất
                        </label>
                        <div className="form-control form-control-sm bg-light d-flex align-items-center">
                          {khuyenMaiChon
                            ? `${khuyenMaiChon.tenChuongTrinh} · ${khuyenMaiChon.loaiGiamGia === 'PHAN_TRAM' ? `${khuyenMaiChon.giaTriGiam}%` : tienViet.format(khuyenMaiChon.giaTriGiam)}`
                            : daTaiKhuyenMai ? 'Không có chương trình phù hợp' : 'Đang tải khuyến mãi…'}
                        </div>
                      </div>

                      <div className="col-12 col-md-5">
                        <label htmlFor="pos-diem-su-dung" className="form-label small mb-1">
                          Điểm muốn dùng
                        </label>
                        <input
                          id="pos-diem-su-dung"
                          type="number"
                          className="form-control form-control-sm"
                          min="0"
                          step="1"
                          max={khachHang?.diemHienCo ?? 0}
                          disabled={!khachHang}
                          value={soDiemSuDung}
                          onChange={(e) => {
                            setSoDiemSuDung(e.target.value)
                            setLoiThanhToan('')
                          }}
                        />
                      </div>
                    </div>

                    {khuyenMaiChon && (
                      <div className="small text-secondary mt-1">
                        {khuyenMaiChon.hoaDonToiThieu !== null && (
                          <span>
                            Đơn tối thiểu {tienViet.format(khuyenMaiChon.hoaDonToiThieu)}
                          </span>
                        )}
                        {khuyenMaiChon.giamToiDa !== null && (
                          <span>
                            {khuyenMaiChon.hoaDonToiThieu !== null ? ' · ' : ''}
                            Giảm tối đa {tienViet.format(khuyenMaiChon.giamToiDa)}
                          </span>
                        )}
                      </div>
                    )}

                    {!khuyenMaiHopLe && (
                      <div className="small text-danger mt-1">
                        Hóa đơn chưa đạt mức tối thiểu của chương trình khuyến mãi.
                      </div>
                    )}
                    {!diemHopLe && (
                      <div className="small text-danger mt-1">
                        Số điểm sử dụng không hợp lệ hoặc vượt quá số điểm hiện có.
                      </div>
                    )}
                    {loiKhuyenMai && (
                      <div className="small text-danger mt-1" role="alert">
                        {loiKhuyenMai}
                      </div>
                    )}
                    <div className="small text-secondary mt-1">
                      1 điểm = 100 VNĐ · Giảm từ điểm: {tienViet.format(giamDiemApDungTheoXu / 100)}
                    </div>
                  </div>
                </div>

                <div className="border rounded-3 p-2 mt-2 pos-summary">
                  <div className="d-flex justify-content-between">
                    <span>Tổng tiền hàng</span>
                    <strong>{tienViet.format(tongTheoXu / 100)}</strong>
                  </div>
                  {giamKhuyenMaiTheoXu > 0 && (
                    <div className="d-flex justify-content-between text-secondary mt-1">
                      <span>Giảm khuyến mãi</span>
                      <span>-{tienViet.format(giamKhuyenMaiTheoXu / 100)}</span>
                    </div>
                  )}
                  {giamDiemApDungTheoXu > 0 && (
                    <div className="d-flex justify-content-between text-secondary mt-1">
                      <span>Giảm từ điểm</span>
                      <span>-{tienViet.format(giamDiemApDungTheoXu / 100)}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center border-top mt-2 pt-2">
                    <strong>Khách thanh toán</strong>
                    <strong className="text-primary fs-5">
                      {tienViet.format(tongThanhToanTheoXu / 100)}
                    </strong>
                  </div>
                </div>

                <fieldset disabled={khoaGio} className="border-0 p-0 m-0 mt-2">
                  <legend className="small fw-semibold mb-1">Phương thức thanh toán</legend>
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
                        <label
                          htmlFor={`pos-${pt}`}
                          className="btn btn-sm btn-outline-primary w-100"
                        >
                          {tenPhuongThuc[pt]}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>

                {phuongThuc === 'TIEN_MAT' && (
                  <fieldset disabled={khoaGio} className="border-0 p-0 m-0 mt-2">
                    <label htmlFor="pos-tien-khach-dua" className="form-label small mb-1">
                      Tiền khách đưa
                    </label>
                    <div className="input-group input-group-sm">
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
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => {
                          setTienKhachDua(String(tongThanhToanTheoXu / 100))
                          setLoiThanhToan('')
                        }}
                      >
                        Vừa đủ
                      </button>
                    </div>

                    {tienKhachDua !== '' && nhanTheoXu === null && (
                      <small className="text-danger">
                        Nhập số tiền bằng chữ số, ví dụ 50000.
                      </small>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-link px-0 py-0 mt-1"
                      aria-expanded={moMenhGia}
                      aria-controls="pos-menh-gia"
                      onClick={() => setMoMenhGia((cu) => !cu)}
                    >
                      {moMenhGia ? 'Thu gọn mệnh giá' : 'Chọn mệnh giá tiền Việt'}
                    </button>

                    <div id="pos-menh-gia" hidden={!moMenhGia} className="mt-1">
                      <div className="row row-cols-3 g-1">
                        {menhGiaViet.map((menhGia) => (
                          <div className="col d-grid" key={menhGia}>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-1"
                              disabled={
                                tienKhachDua.trim() !== '' &&
                                nhanTheoXu === null
                              }
                              onClick={() => congMenhGia(menhGia)}
                            >
                              +{menhGia.toLocaleString('vi-VN')} đ
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {nhanTheoXu !== null && (
                      <div
                        className="d-flex justify-content-between small mt-1"
                        role="status"
                      >
                        <span>{duTien ? 'Tiền trả lại' : 'Còn thiếu'}</span>
                        <strong className={duTien ? 'text-success' : 'text-danger'}>
                          {tienViet.format(
                            Math.abs(nhanTheoXu - tongThanhToanTheoXu) / 100,
                          )}
                        </strong>
                      </div>
                    )}
                  </fieldset>
                )}

                {phuongThuc === 'QR' && (
                  <div className="bg-light border rounded-3 p-2 mt-2">
                    <div className="d-flex justify-content-between gap-2">
                      <strong className="small">Số tiền cần chuyển</strong>
                      <strong className="text-primary">
                        {tienViet.format(tongThanhToanTheoXu / 100)}
                      </strong>
                    </div>
                    <div className="small text-secondary mt-1">
                      Khách quét mã QR tại quầy. Kiểm tra tiền đã vào tài khoản trước khi xác nhận.
                    </div>
                  </div>
                )}

                {loiThanhToan && (
                  <div role="alert" className="alert alert-danger small mt-2 mb-0 py-2">
                    {loiThanhToan}
                  </div>
                )}

                <div className="pos-payment-submit">
                  <button
                    type="button"
                    className="btn btn-primary fw-semibold w-100"
                    onClick={() => void xacNhanThanhToan()}
                    disabled={
                      dangThuTien ||
                      dangTra ||
                      (
                        !choKiemTra &&
                        (
                          dangTimKhach ||
                          chuaChonKhach ||
                          !phuongThuc ||
                          !diemHopLe ||
                          !khuyenMaiHopLe ||
                          (phuongThuc === 'TIEN_MAT' && !duTien)
                        )
                      )
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
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      {moBienLai && bienLai && (
        <CuaSoBienLai
          bienLai={bienLai}
          onDong={() => setMoBienLai(false)}
        />
      )}
    </section>
  )
}
