import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

export type KhachHang = {
  id: number
  hoTen: string
  soDienThoai: string
  diemHienCo: number
  ngayDangKy: string
  trangThai: 'HOAT_DONG' | 'BI_KHOA' | string
}

export type DuLieuKhachHang = {
  hoTen: string
  soDienThoai: string
}

export type LichSuDiem = {
  soHoaDon: string
  thoiGian: string
  soDiemThayDoi: number
  ghiChu: string
}

async function docLoi(response: Response) {
  const data = await response.json().catch(() => null)
  return typeof data?.thongBao === 'string'
    ? data.thongBao
    : typeof data?.message === 'string'
      ? data.message
      : `Yêu cầu thất bại (HTTP ${response.status}).`
}

export async function layDanhSachKhachHang(
  tuKhoa = '',
  signal?: AbortSignal,
): Promise<KhachHang[]> {
  const query = new URLSearchParams({ tuKhoa })
  const response = await fetch(`/api/khach-hang?${query}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function layLichSuDiem(
  id: number,
  signal?: AbortSignal,
): Promise<LichSuDiem[]> {
  const response = await fetch(`/api/khach-hang/${id}/lich-su-diem`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function taoKhachHang(data: DuLieuKhachHang): Promise<KhachHang> {
  const response = await guiYeuCauGhi('/api/khach-hang', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function capNhatKhachHang(
  id: number,
  data: DuLieuKhachHang,
): Promise<KhachHang> {
  const response = await guiYeuCauGhi(`/api/khach-hang/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function capNhatTrangThaiKhachHang(
  id: number,
  trangThai: 'HOAT_DONG' | 'BI_KHOA',
): Promise<KhachHang> {
  const response = await guiYeuCauGhi(`/api/khach-hang/${id}/trang-thai`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trangThai }),
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}
