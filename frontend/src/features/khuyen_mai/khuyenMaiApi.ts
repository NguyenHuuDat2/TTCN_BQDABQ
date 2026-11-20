import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

export type KhuyenMai = {
  id: number
  tenChuongTrinh: string
  loaiGiamGia: 'PHAN_TRAM' | 'SO_TIEN'
  giaTriGiam: number
  hoaDonToiThieu: number | null
  giamToiDa: number | null
  thoiGianBatDau: string
  thoiGianKetThuc: string
  trangThai: 'BAN_NHAP' | 'DA_CONG_BO' | 'NGUNG' | string
  idChiNhanh: number[]
}

export type DuLieuKhuyenMai = {
  tenChuongTrinh: string
  loaiGiamGia: 'PHAN_TRAM' | 'SO_TIEN'
  giaTriGiam: number
  hoaDonToiThieu: number | null
  giamToiDa: number | null
  thoiGianBatDau: string
  thoiGianKetThuc: string
  idChiNhanh: number[]
}

export type ChiNhanhLuaChon = {
  id: number
  tenChiNhanh: string
  trangThai?: string
}

async function docLoi(response: Response) {
  const data = await response.json().catch(() => null)
  return typeof data?.thongBao === 'string'
    ? data.thongBao
    : typeof data?.message === 'string'
      ? data.message
      : `Yêu cầu thất bại (HTTP ${response.status}).`
}

export async function layDanhSachKhuyenMai(signal?: AbortSignal): Promise<KhuyenMai[]> {
  const response = await fetch('/api/khuyen-mai', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function layChiNhanhKhuyenMai(signal?: AbortSignal): Promise<ChiNhanhLuaChon[]> {
  const response = await fetch('/api/chi-nhanh', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(await docLoi(response))
  const data: ChiNhanhLuaChon[] = await response.json()
  return data.filter((cn) => !cn.trangThai || cn.trangThai === 'HOAT_DONG')
}

export async function taoKhuyenMai(data: DuLieuKhuyenMai): Promise<KhuyenMai> {
  const response = await guiYeuCauGhi('/api/khuyen-mai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function capNhatKhuyenMai(
  id: number,
  data: DuLieuKhuyenMai,
): Promise<KhuyenMai> {
  const response = await guiYeuCauGhi(`/api/khuyen-mai/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function congBoKhuyenMai(id: number): Promise<KhuyenMai> {
  const response = await guiYeuCauGhi(`/api/khuyen-mai/${id}/cong-bo`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}

export async function ngungKhuyenMai(id: number): Promise<KhuyenMai> {
  const response = await guiYeuCauGhi(`/api/khuyen-mai/${id}/ngung`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error(await docLoi(response))
  return response.json()
}
