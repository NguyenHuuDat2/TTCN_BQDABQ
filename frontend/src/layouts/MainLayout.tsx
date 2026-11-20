
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  Bell,
  ChartColumn,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Store,
  Tags,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  guiYeuCauGhi,
  type TaiKhoanHienTai,
  type VaiTro,
} from '../features/dang_nhap/xacThucApi'

type MucMenu = {
  path: string
  label: string
  icon: LucideIcon
}

type Props = {
  taiKhoan: TaiKhoanHienTai
  onDangXuat: () => Promise<void>
}

type ThongBaoHeader = {
  id: number
  tieuDe: string
  noiDung: string
  loai: string
  thoiGian: string
  daDoc: boolean
}

export const menuAdmin: MucMenu[] = [
  { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/chi-nhanh', label: 'Chi nhánh', icon: Store },
  { path: '/tai-khoan', label: 'Tài khoản', icon: Users },
  { path: '/san-pham', label: 'Sản phẩm', icon: Package },
  { path: '/khuyen-mai', label: 'Khuyến mãi', icon: Tags },
  { path: '/ton-kho', label: 'Tồn kho', icon: Warehouse },
  { path: '/dieu-chuyen', label: 'Điều chuyển', icon: ArrowLeftRight },
  { path: '/thu-ngan/doi-soat', label: 'Đối soát ca', icon: ClipboardCheck },
  { path: '/bao-cao', label: 'Báo cáo', icon: ChartColumn },
]

export const menuThuNgan: MucMenu[] = [
  { path: '/thu-ngan/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/ban-hang', label: 'Bán hàng POS', icon: ShoppingCart },
  { path: '/thu-ngan/ca', label: 'Ca thu ngân', icon: Clock3 },
  { path: '/thu-ngan/khach-hang', label: 'Khách hàng', icon: Users },
]

export const menuCuaHangTruong: MucMenu[] = [
  { path: '/chi-nhanh/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/thu-ngan/doi-soat', label: 'Đối soát ca', icon: ClipboardCheck },
  { path: '/chi-nhanh/quan-ly-ca', label: 'Quản lý ca', icon: Clock3 },
  { path: '/ton-kho', label: 'Tồn kho', icon: Warehouse },
  { path: '/dieu-chuyen', label: 'Điều chuyển', icon: ArrowLeftRight },
  { path: '/bao-cao', label: 'Báo cáo', icon: ChartColumn },
]

export const menuTheoVaiTro: Record<VaiTro, MucMenu[]> = {
  ADMIN: menuAdmin,
  MANAGER: menuCuaHangTruong,
  CASHIER: menuThuNgan,
}

function DanhSachMenu({
  menu,
  thuGon = false,
  onChon,
}: {
  menu: MucMenu[]
  thuGon?: boolean
  onChon?: () => void
}) {
  const [dangTro, setDangTro] = useState<string | null>(null)
  const [dangFocus, setDangFocus] = useState<string | null>(null)

  return (
    <nav className="d-grid gap-1 p-1" aria-label="Điều hướng chính">
      {menu.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end
          title={thuGon ? label : undefined}
          aria-label={label}
          onClick={onChon}
          onMouseEnter={() => setDangTro(path)}
          onMouseLeave={() => setDangTro(null)}
          onFocus={() => setDangFocus(path)}
          onBlur={() => setDangFocus(null)}
          className={({ isActive }) => [
            'd-flex align-items-center gap-3 py-2 text-decoration-none',
            thuGon ? 'justify-content-center px-1' : 'px-3',
            isActive ? 'fw-semibold' : '',
            isActive || dangTro === path || dangFocus === path
              ? 'text-primary'
              : 'text-body',
          ].join(' ')}
          style={({ isActive }) => {
            const noiBat = isActive || dangTro === path || dangFocus === path

            return {
              minHeight: 44,
              borderLeft: `4px solid ${noiBat ? 'var(--bs-primary)' : 'transparent'}`,
              backgroundColor: noiBat ? '#e5f5fa' : 'transparent',
            }
          }}
        >
          <Icon size={19} className="flex-shrink-0" aria-hidden="true" />
          {!thuGon && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

export default function MainLayout({ taiKhoan, onDangXuat }: Props) {
  const { pathname } = useLocation()
  const menu = menuTheoVaiTro[taiKhoan.maVaiTro]
  const tenTrang = menu.find((muc) => muc.path === pathname)?.label ?? 'Tổng quan'

  const [thuGon, setThuGon] = useState(false)
  const [hopMo, setHopMo] = useState<'tai-khoan' | 'thong-bao' | null>(null)
  const [dangThoat, setDangThoat] = useState(false)

  const [danhSachThongBao, setDanhSachThongBao] = useState<ThongBaoHeader[]>([])
  const [dangTaiThongBao, setDangTaiThongBao] = useState(false)
  const [loiThongBao, setLoiThongBao] = useState('')

  const soThongBaoChuaDoc = danhSachThongBao.filter(
    (x) => !x.daDoc,
  ).length

  const khuVucHeader = useRef<HTMLDivElement>(null)
  const menuMobile = useRef<HTMLDialogElement>(null)

  const taiThongBao = useCallback(async () => {
    setDangTaiThongBao(true)
    setLoiThongBao('')

    try {
      const res = await fetch('/api/quan-ly/thong-bao', {
        credentials: 'same-origin',
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data: ThongBaoHeader[] = await res.json()
      setDanhSachThongBao(data)
    } catch {
      setLoiThongBao('Không tải được danh sách thông báo.')
    } finally {
      setDangTaiThongBao(false)
    }
  }, [])

  useEffect(() => {
    void taiThongBao()
  }, [taiThongBao])

  useEffect(() => {
    if (!hopMo) return

    function bamBenNgoai(event: PointerEvent) {
      if (
        event.target instanceof Node
        && !khuVucHeader.current?.contains(event.target)
      ) {
        setHopMo(null)
      }
    }

    function bamPhim(event: KeyboardEvent) {
      if (event.key === 'Escape') setHopMo(null)
    }

    document.addEventListener('pointerdown', bamBenNgoai)
    document.addEventListener('keydown', bamPhim)

    return () => {
      document.removeEventListener('pointerdown', bamBenNgoai)
      document.removeEventListener('keydown', bamPhim)
    }
  }, [hopMo])

  async function danhDauDaDoc(id: number) {
    try {
      const res = await guiYeuCauGhi(
        `/api/quan-ly/thong-bao/${id}/da-doc`,
        { method: 'PUT' },
      )

      if (!res.ok) {
        throw new Error('Không cập nhật được thông báo.')
      }

      setDanhSachThongBao((ds) =>
        ds.map((x) =>
          x.id === id ? { ...x, daDoc: true } : x,
        ),
      )
    } catch {
      setLoiThongBao('Không thể cập nhật trạng thái thông báo.')
    }
  }

  async function thoatTaiKhoan() {
    if (dangThoat) return

    setDangThoat(true)

    try {
      await onDangXuat()
    } finally {
      setDangThoat(false)
    }
  }

  function moMenuMobile() {
    setHopMo(null)
    menuMobile.current?.showModal()
  }

  function tenLoaiThongBao(loai: string) {
    if (loai === 'KHUYEN_MAI') return 'Khuyến mãi'
    if (loai === 'DIEU_CHUYEN') return 'Điều chuyển'
    return loai
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light text-start">
      <header
        className="sticky-top d-flex align-items-center gap-2 gap-md-3 border-bottom bg-white px-2 px-md-4 py-2"
        style={{ minHeight: 58 }}
      >
        <button
          type="button"
          className="btn btn-light d-md-none"
          aria-label="Mở điều hướng"
          onClick={moMenuMobile}
        >
          <Menu size={19} />
        </button>

        <span className="badge bg-primary fs-6">POS</span>
        <span className="fw-bold text-nowrap d-none d-sm-inline">
          Web POS
        </span>

        <button
          type="button"
          className="btn btn-light d-none d-md-inline-flex"
          aria-label={thuGon ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          aria-expanded={!thuGon}
          onClick={() => setThuGon((giaTri) => !giaTri)}
        >
          {thuGon
            ? <PanelLeftOpen size={18} />
            : <PanelLeftClose size={18} />}
        </button>

        <div className="small text-secondary text-truncate d-none d-sm-block">
          {taiKhoan.tenVaiTro} / {tenTrang}
        </div>

        <div
          ref={khuVucHeader}
          className="ms-auto d-flex align-items-center gap-2 position-relative"
        >
          <button
            type="button"
            className="btn btn-light rounded-circle position-relative"
            aria-label={`Thông báo, ${soThongBaoChuaDoc} chưa đọc`}
            aria-expanded={hopMo === 'thong-bao'}
            onClick={() => {
              const dangMo = hopMo === 'thong-bao'
              setHopMo(dangMo ? null : 'thong-bao')
              if (!dangMo) void taiThongBao()
            }}
          >
            <Bell size={18} />

            {soThongBaoChuaDoc > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {soThongBaoChuaDoc > 99 ? '99+' : soThongBaoChuaDoc}
              </span>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
            aria-label="Tài khoản"
            aria-expanded={hopMo === 'tai-khoan'}
            onClick={() => setHopMo(
              hopMo === 'tai-khoan' ? null : 'tai-khoan',
            )}
          >
            <CircleUserRound size={18} />
            <span className="d-none d-sm-inline">Tài khoản</span>
          </button>

          {hopMo && (
            <div
              className="position-absolute top-100 end-0 mt-2 bg-white border rounded-3 shadow-sm overflow-hidden"
              style={{
                width: hopMo === 'thong-bao'
                  ? 'min(360px, 90vw)'
                  : 'min(280px, 90vw)',
              }}
            >
              {hopMo === 'thong-bao' ? (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h6 mb-0">Thông báo</h2>
                    <span className="badge text-bg-primary">
                      {soThongBaoChuaDoc} chưa đọc
                    </span>
                  </div>

                  {dangTaiThongBao && (
                    <p className="small text-secondary mb-2">
                      Đang tải thông báo...
                    </p>
                  )}

                  {loiThongBao && (
                    <div className="small text-danger mb-2" role="alert">
                      {loiThongBao}
                    </div>
                  )}

                  <div
                    className="overflow-auto"
                    style={{ maxHeight: 350 }}
                  >
                    {!dangTaiThongBao && danhSachThongBao.length === 0 && (
                      <p className="small text-secondary mb-0">
                        Chưa có thông báo.
                      </p>
                    )}

                    {danhSachThongBao.map((x) => (
                      <button
                        key={x.id}
                        type="button"
                        className={`w-100 text-start border-0 rounded-2 p-2 mb-1 ${
                          x.daDoc ? 'bg-white' : 'bg-light'
                        }`}
                        onClick={() => {
                          if (!x.daDoc) void danhDauDaDoc(x.id)
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <strong className="small">
                            {x.tieuDe}
                          </strong>

                          {!x.daDoc && (
                            <span className="badge text-bg-primary">
                              Mới
                            </span>
                          )}
                        </div>

                        <div className="small text-secondary mt-1">
                          {x.noiDung}
                        </div>

                        <div className="small text-secondary mt-1">
                          {tenLoaiThongBao(x.loai)} · {x.thoiGian}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary w-100 mt-2"
                    disabled={dangTaiThongBao}
                    onClick={() => void taiThongBao()}
                  >
                    Làm mới thông báo
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3">
                    <div className="fw-semibold">
                      {taiKhoan.hoTen}
                    </div>

                    <div className="small text-secondary">
                      {taiKhoan.tenVaiTro}
                    </div>

                    {taiKhoan.tenChiNhanh && (
                      <div className="small text-secondary">
                        {taiKhoan.tenChiNhanh}
                      </div>
                    )}
                  </div>

                  <div className="border-top p-2">
                    <button
                      type="button"
                      className="btn btn-light text-danger w-100 d-flex align-items-center gap-2"
                      disabled={dangThoat}
                      onClick={() => void thoatTaiKhoan()}
                    >
                      <LogOut size={16} />
                      {dangThoat ? 'Đang đăng xuất…' : 'Đăng xuất'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="d-flex flex-grow-1">
        <aside
          className="d-none d-md-block flex-shrink-0 bg-white border-end py-3"
          style={{ width: thuGon ? 64 : 232 }}
        >
          <DanhSachMenu menu={menu} thuGon={thuGon} />
        </aside>

        <main className="flex-grow-1" style={{ minWidth: 0 }}>
          <Outlet context={taiKhoan} />
        </main>
      </div>

      <dialog
        ref={menuMobile}
        aria-labelledby="tieu-de-menu-mobile"
        className="border-0 p-0 m-0 bg-white"
        style={{
          width: 'min(290px, 85vw)',
          height: '100dvh',
          maxHeight: '100dvh',
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return

          const rect = event.currentTarget.getBoundingClientRect()

          if (event.clientX < rect.left || event.clientX > rect.right) {
            menuMobile.current?.close()
          }
        }}
      >
        <div className="d-flex justify-content-between align-items-center border-bottom p-3">
          <h2 id="tieu-de-menu-mobile" className="h6 mb-0">
            Web POS
          </h2>

          <button
            type="button"
            className="btn btn-light"
            aria-label="Đóng điều hướng"
            onClick={() => menuMobile.current?.close()}
          >
            <X size={18} />
          </button>
        </div>

        <DanhSachMenu
          menu={menu}
          onChon={() => menuMobile.current?.close()}
        />
      </dialog>
    </div>
  )
}
