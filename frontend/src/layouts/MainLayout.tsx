import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  Bell,
  ChartColumn,
  CircleUserRound,
  LayoutDashboard,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  Tags,
  Users,
  Warehouse,
} from 'lucide-react'

export const menuAdmin = [
  { path: '/tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/chi-nhanh', label: 'Chi nhánh', icon: Store },
  { path: '/tai-khoan', label: 'Tài khoản', icon: Users },
  { path: '/san-pham', label: 'Sản phẩm', icon: Package },
  { path: '/khuyen-mai', label: 'Khuyến mãi', icon: Tags },
  { path: '/ton-kho', label: 'Tồn kho', icon: Warehouse },
  { path: '/dieu-chuyen', label: 'Điều chuyển', icon: ArrowLeftRight },
  { path: '/bao-cao', label: 'Báo cáo', icon: ChartColumn },
]

type MenuDieuHuongProps = {
  thuGon?: boolean
  trenDienThoai?: boolean
}

function MenuDieuHuong({
  thuGon = false,
  trenDienThoai = false,
}: MenuDieuHuongProps) {
  const [mucHover, setMucHover] = useState<string | null>(null)

  return (
    <nav aria-label="Điều hướng quản lý" className="d-grid gap-1">
      {menuAdmin.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          title={thuGon ? label : undefined}
          aria-label={label}
          data-bs-dismiss={trenDienThoai ? 'offcanvas' : undefined}
          data-bs-target={trenDienThoai ? '#menuMobile' : undefined}
          onMouseEnter={() => setMucHover(path)}
          onMouseLeave={() => setMucHover(null)}
          className={({ isActive }) => {
            const noiBat = isActive || mucHover === path

            return [
              'd-flex align-items-center gap-3 px-3 py-2',
              'text-decoration-none border-start border-4',
              thuGon ? 'justify-content-center' : '',
              noiBat
                ? 'border-primary bg-info-subtle text-primary'
                : 'border-white bg-white text-body',
              isActive ? 'fw-semibold' : '',
            ].join(' ')
          }}
        >
          <Icon
            size={20}
            strokeWidth={1.75}
            className="flex-shrink-0"
            aria-hidden="true"
          />
          {!thuGon && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

export default function MainLayout() {
  const [thuGon, setThuGon] = useState(false)
  const { pathname } = useLocation()

  const trangHienTai = menuAdmin.find(
    (muc) => pathname === muc.path || pathname.startsWith(`${muc.path}/`),
  )?.label

  return (
    <div className="d-flex flex-column min-vh-100 w-100 bg-body-tertiary text-start">
      <header className="sticky-top bg-white border-bottom">
        <div className="d-flex align-items-center gap-2 px-3 px-lg-4 py-2">
          <button
            type="button"
            className="btn btn-light d-lg-none"
            data-bs-toggle="offcanvas"
            data-bs-target="#menuMobile"
            aria-controls="menuMobile"
            aria-label="Mở menu điều hướng"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <span className="badge bg-primary fs-6">POS</span>
          <strong className="d-none d-sm-inline text-nowrap">Web POS</strong>

          <button
            type="button"
            className="btn btn-light d-none d-lg-inline-flex ms-2"
            onClick={() => setThuGon((hienTai) => !hienTai)}
            aria-controls="menuDesktop"
            aria-expanded={!thuGon}
            aria-label={thuGon ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={thuGon ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {thuGon ? (
              <PanelLeftOpen size={20} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={20} aria-hidden="true" />
            )}
          </button>

          {trangHienTai && (
            <span className="d-none d-md-inline ms-2 text-secondary">
              Quản lý / {trangHienTai}
            </span>
          )}

          <div className="ms-auto d-flex align-items-center gap-2">
            <div className="dropdown">
              <button
                type="button"
                className="btn btn-light d-flex align-items-center rounded-circle p-2"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Mở thông báo"
                title="Thông báo"
              >
                <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <div className="dropdown-menu dropdown-menu-end p-3 shadow-sm">
                <h2 className="h6 mb-2">Thông báo</h2>
                <p className="small text-secondary mb-0">
                  Chưa kết nối dữ liệu thông báo.
                </p>
              </div>
            </div>

            <div className="dropdown">
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Mở menu tài khoản"
              >
                <CircleUserRound
                  size={22}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="d-none d-sm-inline">Tài khoản</span>
              </button>

              <div className="dropdown-menu dropdown-menu-end shadow-sm">
                <span className="dropdown-item-text text-nowrap">
                  Vai trò: Admin chuỗi
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-fluid d-flex flex-column flex-grow-1">
        <div className="row flex-grow-1">
          <aside
            id="menuDesktop"
            className={[
              'd-none d-lg-block bg-white border-end px-1 py-3',
              thuGon ? 'col-auto' : 'col-lg-3 col-xl-2',
            ].join(' ')}
          >
            <MenuDieuHuong thuGon={thuGon} />
          </aside>

          <div className="col overflow-auto p-0">
            <Outlet />
          </div>
        </div>
      </div>

      <aside
        id="menuMobile"
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        aria-labelledby="menuMobileTitle"
      >
        <div className="offcanvas-header border-bottom">
          <h2 id="menuMobileTitle" className="offcanvas-title h5">
            Web POS
          </h2>

          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Đóng menu"
          />
        </div>

        <div className="offcanvas-body px-2">
          <MenuDieuHuong trenDienThoai />
        </div>
      </aside>
    </div>
  )
}