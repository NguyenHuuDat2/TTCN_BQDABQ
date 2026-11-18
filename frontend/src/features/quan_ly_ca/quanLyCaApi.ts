
import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

export type NhanVienThuNgan = {
  id: number
  hoTen: string
  tenDangNhap: string
}

export type CaLamViec = {
  ngayLamViec: string
  loaiCa: string
  gioBatDau: string
  gioKetThuc: string
  trangThai: string
  idCaLamViec: number | null
  idPhanCongCa: number | null
  idTaiKhoanThuNgan: number | null
  tenThuNgan: string | null
  tenDangNhapThuNgan: string | null
  coPhien: boolean
}

export type PhanCongRequest = {
  ngayLamViec: string
  loaiCa: string
  idTaiKhoanThuNgan: number
}

const url = '/api/quan-ly-ca'

async function docJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as {
      detail?: string
      message?: string
    } | null

    const thongBao =
      body?.detail ||
      body?.message ||
      `Yêu cầu thất bại (HTTP ${response.status}).`

    throw new Error(thongBao)
  }

  return response.json() as Promise<T>
}

export async function layNhanVienThuNgan(
  signal?: AbortSignal,
): Promise<NhanVienThuNgan[]> {
  const response = await fetch(`${url}/nhan-vien`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<NhanVienThuNgan[]>(response)
}

export async function layDanhSachCa(
  ngay: string,
  signal?: AbortSignal,
): Promise<CaLamViec[]> {
  const query = new URLSearchParams({ ngay })

  const response = await fetch(`${url}?${query}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<CaLamViec[]>(response)
}

export async function phanCongCa(
  duLieu: PhanCongRequest,
): Promise<CaLamViec> {
  const response = await guiYeuCauGhi(`${url}/phan-cong`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(duLieu),
  })

  return docJson<CaLamViec>(response)
}
