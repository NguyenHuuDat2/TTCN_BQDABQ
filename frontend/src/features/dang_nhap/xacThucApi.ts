export type VaiTro = 'ADMIN' | 'MANAGER' | 'CASHIER'

export type TaiKhoanHienTai = {
  id: number
  tenDangNhap: string
  hoTen: string
  maVaiTro: VaiTro
  tenVaiTro: string
  idChiNhanh: number | null
  tenChiNhanh: string | null
}

export async function guiYeuCauGhi(url: string, options: RequestInit) {
  const csrfResponse = await fetch('/api/xac-thuc/csrf', {
    credentials: 'same-origin',
    cache: 'no-store',
  })

  if (!csrfResponse.ok) {
    throw new Error('Không lấy được mã xác thực. Vui lòng kiểm tra backend.')
  }

  const csrf: { headerName: string; token: string } = await csrfResponse.json()
  const headers = new Headers(options.headers)
  headers.set(csrf.headerName, csrf.token)

  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers,
  })
}

export async function layTaiKhoanHienTai(
  signal?: AbortSignal,
): Promise<TaiKhoanHienTai | null> {
  const response = await fetch('/api/xac-thuc/toi', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  if (response.status === 401) return null
  if (!response.ok) throw new Error('Không tải được thông tin tài khoản.')

  return response.json()
}

export async function dangNhap(tenDangNhap: string, matKhau: string) {
  const response = await guiYeuCauGhi('/api/xac-thuc/dang-nhap', {
    method: 'POST',
    body: new URLSearchParams({
      tenDangNhap: tenDangNhap.trim(),
      matKhau,
    }),
  })

  if (response.status === 401) {
    throw new Error('Tên đăng nhập hoặc mật khẩu chưa đúng, hoặc tài khoản đã bị khóa.')
  }

  if (!response.ok) {
    throw new Error(`Đăng nhập thất bại (HTTP ${response.status}).`)
  }

  const taiKhoan = await layTaiKhoanHienTai()

  if (!taiKhoan) {
    throw new Error('Trình duyệt chưa nhận được phiên đăng nhập.')
  }

  return taiKhoan
}

export async function dangXuat() {
  const response = await guiYeuCauGhi('/api/xac-thuc/dang-xuat', {
    method: 'POST',
  })

  if (!response.ok) throw new Error('Đăng xuất thất bại. Vui lòng thử lại.')
}