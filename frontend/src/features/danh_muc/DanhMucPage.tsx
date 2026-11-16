import { useEffect, useState } from 'react'
import { layDanhSachDanhMuc, type DanhMuc } from './danhMucApi'

export default function DanhMucPage() {
  const [danhSach, setDanhSach] = useState<DanhMuc[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function taiDanhMuc() {
      try {
        const duLieu = await layDanhSachDanhMuc(controller.signal)

        if (!controller.signal.aborted) {
          setDanhSach(duLieu)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoi(
            error instanceof Error
              ? error.message
              : 'Lỗi khi tải danh mục.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setDangTai(false)
        }
      }
    }

    void taiDanhMuc()
    return () => controller.abort()
  }, [])

  return (
    <main className="container-fluid p-3 p-md-4">
      <h1 className="h4 mb-3">Danh mục sản phẩm</h1>

      {dangTai ? (
        <p className="text-muted" role="status">
          Đang tải danh mục…
        </p>
      ) : loi ? (
        <div className="alert alert-danger" role="alert">
          {loi}
        </div>
      ) : danhSach.length === 0 ? (
        <p className="text-muted">Chưa có danh mục.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Mã danh mục</th>
                <th scope="col">Tên danh mục</th>
                <th scope="col">Mô tả</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {danhSach.map((dm) => (
                <tr key={dm.id}>
                  <td>{dm.maDanhMuc}</td>
                  <td>{dm.tenDanhMuc}</td>
                  <td>{dm.moTa ?? '—'}</td>
                  <td>
                    {dm.trangThai === 'DANG_DUNG' ? (
                      <span className="badge text-bg-success">Đang dùng</span>
                    ) : (
                      <span className="badge text-bg-secondary">
                        {dm.trangThai}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}