import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout, { menuTheoVaiTro } from './layouts/MainLayout'
import SanPhamPage from './features/san_pham/SanPhamPage'
import BanHangPage from './features/ban_hang/BanHangPage'
import DangNhapPage from './features/dang_nhap/DangNhapPage'
import TaiKhoanPage from './features/tai_khoan/TaiKhoanPage'
import ChiNhanhPage from './features/chi_nhanh/ChiNhanhPage'
import TongQuanChiNhanhPage from './features/chi_nhanh/TongQuanChiNhanhPage'

import {
  dangXuat,
  layTaiKhoanHienTai,
  type TaiKhoanHienTai,
  type VaiTro,
} from './features/dang_nhap/xacThucApi'

const trangDauTheoVaiTro: Record<VaiTro, string> = {
  ADMIN: '/san-pham',
  MANAGER: '/chi-nhanh/tong-quan',
  CASHIER: '/ban-hang',
}

function TrangDangXayDung({ tenTrang }: { tenTrang: string }) {
  return (
    <section className="p-3 p-md-4">
      <h1 className="h4 mb-3">{tenTrang}</h1>
      <p className="text-secondary">Chức năng đang được xây dựng.</p>
    </section>
  )
}

export default function App() {
  const [taiKhoan, setTaiKhoan] = useState<TaiKhoanHienTai | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function kiemTraPhien() {
      try {
        const ketQua = await layTaiKhoanHienTai(controller.signal)

        if (!controller.signal.aborted) {
          setTaiKhoan(ketQua)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoi(
            error instanceof Error ? error.message : 'Không kết nối được backend.',
          )
        }
      } finally {
        if (!controller.signal.aborted) setDangTai(false)
      }
    }

    void kiemTraPhien()
    return () => controller.abort()
  }, [])

  async function thoat() {
    try {
      await dangXuat()
      setTaiKhoan(null)
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Không đăng xuất được.',
      )
    }
  }

  if (dangTai) {
    return (
      <p className="p-4 text-secondary" role="status">
        Đang kiểm tra phiên đăng nhập…
      </p>
    )
  }

  if (loi) {
    return (
      <div className="p-4">
        <p className="text-danger" role="alert">{loi}</p>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!taiKhoan) {
    return (
      <Routes>
        <Route
          path="/dang-nhap"
          element={<DangNhapPage onDangNhap={setTaiKhoan} />}
        />
        <Route path="*" element={<Navigate to="/dang-nhap" replace />} />
      </Routes>
    )
  }

  const menu = menuTheoVaiTro[taiKhoan.maVaiTro]
  const trangDau = trangDauTheoVaiTro[taiKhoan.maVaiTro]

  function noiDungTrang(path: string, label: string) {
    if (path === '/san-pham') return <SanPhamPage />
    if (path === '/ban-hang') return <BanHangPage />
    if (path === '/tai-khoan') return <TaiKhoanPage/>
    if (path === '/chi-nhanh') return <ChiNhanhPage/>
    if (path === '/chi-nhanh/tong-quan') return <TongQuanChiNhanhPage />

    return <TrangDangXayDung tenTrang={label} />
  }

  return (
    <Routes>
      <Route
        element={<MainLayout taiKhoan={taiKhoan} onDangXuat={thoat} />}
      >
        {menu.map((muc) => (
          <Route
            key={muc.path}
            path={muc.path}
            element={noiDungTrang(muc.path, muc.label)}
          />
        ))}

        <Route path="*" element={<Navigate to={trangDau} replace />} />
      </Route>
    </Routes>
  )
}