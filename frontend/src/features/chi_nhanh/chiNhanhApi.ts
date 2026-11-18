import { guiYeuCauGhi } from '../dang_nhap/xacThucApi'

export type DuLieuChiNhanh = {
  maChiNhanh: string
  tenChiNhanh: string
  diaChi: string
  soDienThoai: string | null
}

export type ChiNhanh = DuLieuChiNhanh & {
  id: number
  trangThai: string
}

const url = '/api/chi-nhanh'

async function docJson<T>(response: Response): Promise<T> {
  const thongBaoLoi: Record<number, string> = {
    400: 'Kiểm tra lại mã, tên, địa chỉ và số điện thoại chi nhánh.',
    401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    403: 'Bạn không có quyền thực hiện yêu cầu quản lý chi nhánh.',
    404: 'Không tìm thấy chi nhánh.',
    409: 'Mã chi nhánh đã tồn tại.',
  }

  if (!response.ok) {
    throw new Error(
      thongBaoLoi[response.status] ?? `Yêu cầu thất bại (HTTP ${response.status}).`,
    )
  }

  return response.json() as Promise<T>
}

export async function layDanhSachChiNhanh(signal?: AbortSignal): Promise<ChiNhanh[]> {
  const response = await fetch(url, { signal, credentials: 'same-origin' })
  return docJson<ChiNhanh[]>(response)
}

export async function luuChiNhanh(
  duLieu: DuLieuChiNhanh,
  id?: number,
): Promise<ChiNhanh> {
  const dangSua = id !== undefined
  const response = await guiYeuCauGhi(dangSua ? `${url}/${id}` : url, {
    method: dangSua ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
  return docJson<ChiNhanh>(response)
}