import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout, { menuAdmin } from './layouts/MainLayout'
import SanPhamPage from './features/san_pham/SanPhamPage'

function TrangDangXayDung({ tenTrang }: { tenTrang: string }) {
  return (
    <main className="p-3 p-md-4">
      <h1 className="h4 mb-3">{tenTrang}</h1>
      <p className="text-secondary">Chức năng đang được xây dựng.</p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/san-pham" replace />} />

        {menuAdmin.map((muc) => (
          <Route
            key={muc.path}
            path={muc.path}
            element={
              muc.path === '/san-pham'
                ? <SanPhamPage />
                : <TrangDangXayDung tenTrang={muc.label} />
            }
          />
        ))}

        <Route path="*" element={<Navigate to="/san-pham" replace />} />
      </Route>
    </Routes>
  )
}