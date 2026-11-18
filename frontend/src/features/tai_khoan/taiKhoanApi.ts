
import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

export type TrangThaiTaiKhoan = 'HOAT_DONG' | 'BI_KHOA'

export type TaiKhoan = {
  id: number
  idVaiTro: number
  idChiNhanh: number | null
  hoTen: string
  tenDangNhap: string
  soDienThoai: string | null
  trangThai: TrangThaiTaiKhoan
  maVaiTro: string
  tenVaiTro: string
  tenChiNhanh: string | null
}

export type VaiTroOption = {
  id: number
  maVaiTro: string
  tenVaiTro: string
}

export type ChiNhanhOption = {
  id: number
  maChiNhanh: string
  tenChiNhanh: string
}

export type TuyChonTaiKhoan = {
  vaiTro: VaiTroOption[]
  chiNhanh: ChiNhanhOption[]
}

export type DuLieuTaiKhoan = {
  idVaiTro: number
  idChiNhanh: number | null
  hoTen: string
  tenDangNhap: string
  matKhau: string | null
  soDienThoai: string | null
  trangThai: TrangThaiTaiKhoan
}

const url = '/api/tai-khoan'

async function docJson<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }
  if (response.status === 403) {
    throw new Error('Tài khoản của bạn không có quyền quản lý nhân viên.')
  }
  if (response.status === 409) {
    throw new Error('Tên đăng nhập đã tồn tại. Hãy chọn tên khác.')
  }
  if (response.status === 400) {
    throw new Error('Dữ liệu tài khoản không hợp lệ. Kiểm tra vai trò, chi nhánh, tên đăng nhập, mật khẩu và trạng thái.')
  }
  if (!response.ok) {
    throw new Error(`Yêu cầu thất bại (HTTP ${response.status}).`)
  }
  return response.json() as Promise<T>
}

export async function layDanhSachTaiKhoan(signal?: AbortSignal): Promise<TaiKhoan[]> {
  return docJson<TaiKhoan[]>(await fetch(url, {
    signal,
    credentials: 'same-origin',
  }))
}

export async function layTuyChonTaiKhoan(signal?: AbortSignal): Promise<TuyChonTaiKhoan> {
  return docJson<TuyChonTaiKhoan>(await fetch(`${url}/tuy-chon`, {
    signal,
    credentials: 'same-origin',
  }))
}

export async function luuTaiKhoan(duLieu: DuLieuTaiKhoan, id?: number): Promise<TaiKhoan> {
  const dangSua = id !== undefined
  const response = await guiYeuCauGhi(dangSua ? `${url}/${id}` : url, {
    method: dangSua ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
  return docJson<TaiKhoan>(response)
}
