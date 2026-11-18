import { useOutletContext } from 'react-router-dom'
import type { TaiKhoanHienTai } from '../dang_nhap/xacThucApi'

export default function TongQuanChiNhanhPage() {
  const taiKhoan = useOutletContext<TaiKhoanHienTai>()

  return (
    <section className="w-100 p-3 p-md-4 text-start">
      <h1 className="h3 fw-bold mb-4">Tổng quan chi nhánh</h1>

      <dl className="bg-white border rounded-3 p-3 p-md-4 mb-0">
        <dt className="small text-secondary mb-1">Chi nhánh phụ trách</dt>
        <dd className="h5 mb-4">
          {taiKhoan.tenChiNhanh?.trim() || 'Chưa có thông tin chi nhánh'}
        </dd>

        <dt className="small text-secondary mb-1">Cửa hàng trưởng</dt>
        <dd className="mb-0">{taiKhoan.hoTen}</dd>
      </dl>
    </section>
  )
}