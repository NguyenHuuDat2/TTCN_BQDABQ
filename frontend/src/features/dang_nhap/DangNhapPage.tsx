import { useState, type FormEvent } from 'react'
import { dangNhap, type TaiKhoanHienTai } from './xacThucApi'

type Props = {
  onDangNhap: (taiKhoan: TaiKhoanHienTai) => void
}

export default function DangNhapPage({ onDangNhap }: Props) {
  const [tenDangNhap, setTenDangNhap] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')

  async function guiForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dangGui) return

    setLoi('')
    setDangGui(true)

    try {
      const taiKhoan = await dangNhap(tenDangNhap, matKhau)
      onDangNhap(taiKhoan)
    } catch (error) {
      setLoi(error instanceof Error ? error.message : 'Không thể đăng nhập.')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <main className="min-vh-100 bg-light d-flex align-items-center justify-content-center px-3 py-4">
      <section
        className="card w-100 rounded-3 shadow-sm"
        style={{ maxWidth: 420 }}
        aria-labelledby="tieu-de-dang-nhap"
      >
        <div className="card-body p-4 p-sm-5">
          <header className="text-center mb-5">
            <h1 id="tieu-de-dang-nhap" className="h3 fw-bold mb-2">
              WEB POS
            </h1>
            <p className="text-secondary mb-0">Đăng nhập hệ thống bán hàng</p>
          </header>

          <form onSubmit={guiForm}>
            <div className="mb-3">
              <label htmlFor="ten-dang-nhap" className="form-label fw-semibold">
                Tên đăng nhập
              </label>
              <input
                id="ten-dang-nhap"
                name="username"
                className="form-control"
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                value={tenDangNhap}
                onChange={(event) => setTenDangNhap(event.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="mat-khau" className="form-label fw-semibold">
                Mật khẩu
              </label>
              <input
                id="mat-khau"
                name="password"
                type="password"
                className="form-control"
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                value={matKhau}
                onChange={(event) => setMatKhau(event.target.value)}
                required
              />
            </div>

            {loi && (
              <p className="alert alert-danger small py-2" role="alert">{loi}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 fw-semibold mt-2"
              disabled={dangGui}
            >
              {dangGui ? 'Đang đăng nhập…' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          <p className="text-center text-secondary small mt-4 mb-0">
            Dùng chung cho Admin, Cửa hàng trưởng và Thu ngân
          </p>
        </div>
      </section>
    </main>
  )
}