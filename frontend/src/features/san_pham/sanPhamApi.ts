export type SanPham = {
  id: number
  idDanhMuc: number
  maSanPham: string
  tenSanPham: string
  maVach: string | null
  donViTinh: string
  giaBan: number
  trangThai: string
}

export type DuLieuSanPham = Omit<SanPham, 'id'>

const url = '/api/san-pham'

export async function layDanhSachSanPham(signal: AbortSignal): Promise<SanPham[]> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Không tải được sản phẩm (HTTP ${response.status}).`)
  }

  return response.json()
}

export async function luuSanPham(duLieu: DuLieuSanPham, id?: number): Promise<SanPham> {
  const dangSua = id !== undefined

  const response = await fetch(dangSua ? `${url}/${id}` : url, {
    method: dangSua ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })

  if (response.status === 409) {
    throw new Error('Mã sản phẩm hoặc mã vạch đã tồn tại.')
  }

  if (!response.ok) {
    throw new Error(`Không lưu được sản phẩm (HTTP ${response.status}).`)
  }

  return response.json()
}