export type DanhMuc = {
  id: number
  maDanhMuc: string
  tenDanhMuc: string
  moTa: string | null
  trangThai: string
}

export async function layDanhSachDanhMuc(
  signal: AbortSignal,
): Promise<DanhMuc[]> {
  const response = await fetch('/api/danh-muc', { signal })

  if (!response.ok) {
    throw new Error(`Không tải được danh mục (HTTP ${response.status}).`)
  }

  return response.json()
}