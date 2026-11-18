
import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

export type PhanCongCa = {
  idPhanCongCa: number
  idCaLamViec: number
  ngayLamViec: string
  loaiCa: string
  gioBatDau: string
  gioKetThuc: string
  tenChiNhanh: string
}

export type PhienThuNgan = {
  id: number
  ngayLamViec: string
  loaiCa: string
  tenChiNhanh: string
  tenThuNgan: string
  thoiGianMo: string
  thoiGianDong: string | null
  tienDauCa: number
  doanhThuTienMat: number
  doanhThuQr: number
  tienDuKienCuoiCa: number
  tienThucTe: number | null
  tienChenhLech: number | null
  soHoaDon: number
  trangThai: string
}

export type GiaoDichDoiSoat = {
  soHoaDon: string
  thoiGian: string | null
  phuongThuc: string | null
  soTien: number | null
  trangThai: string | null
}

export type DoiSoatChiTiet = {
  phien: PhienThuNgan
  giaoDich: GiaoDichDoiSoat[]
}

const url = '/api/thu-ngan'

async function docJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let thongBao = `Yêu cầu thất bại (HTTP ${response.status}).`

    if (response.status === 401) {
      thongBao = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    } else if (response.status === 403) {
      thongBao = 'Bạn không có quyền thực hiện chức năng này.'
    } else {
      try {
        const body = await response.json()
        thongBao = body.detail ?? body.message ?? body.thongBao ?? thongBao
      } catch {
        // 
      }
    }

    throw new Error(thongBao)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json() as Promise<T>
}

export async function layPhanCongCuaToi(
  signal?: AbortSignal,
): Promise<PhanCongCa[]> {
  const response = await fetch(`${url}/phan-cong-cua-toi`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<PhanCongCa[]>(response)
}

export async function layPhienHienTai(
  signal?: AbortSignal,
): Promise<PhienThuNgan | null> {
  const response = await fetch(`${url}/phien/hien-tai`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<PhienThuNgan | null>(response)
}

export async function moPhien(
  idPhanCongCa: number,
  tienDauCa: number,
): Promise<PhienThuNgan> {
  const response = await guiYeuCauGhi(`${url}/phien/mo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idPhanCongCa, tienDauCa }),
  })

  return docJson<PhienThuNgan>(response)
}

export async function dongPhien(
  tienThucTe: number,
): Promise<PhienThuNgan> {
  const response = await guiYeuCauGhi(`${url}/phien/dong`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tienThucTe }),
  })

  return docJson<PhienThuNgan>(response)
}

export async function layDanhSachDoiSoat(
  signal?: AbortSignal,
): Promise<PhienThuNgan[]> {
  const response = await fetch(`${url}/doi-soat`, {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<PhienThuNgan[]>(response)
}

export async function layChiTietDoiSoat(
  id: number,
): Promise<DoiSoatChiTiet> {
  const response = await fetch(`${url}/doi-soat/${id}`, {
    credentials: 'same-origin',
    cache: 'no-store',
  })

  return docJson<DoiSoatChiTiet>(response)
}

export async function xacNhanDoiSoat(
  id: number,
): Promise<PhienThuNgan> {
  const response = await guiYeuCauGhi(`${url}/doi-soat/${id}`, {
    method: 'POST',
  })

  return docJson<PhienThuNgan>(response)
}
