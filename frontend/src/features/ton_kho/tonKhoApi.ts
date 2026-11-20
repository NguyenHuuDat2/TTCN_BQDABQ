
export type TonKho = {
  id: number
  idChiNhanh: number
  tenChiNhanh: string
  idSanPham: number
  maSanPham: string
  maVach: string | null
  tenSanPham: string
  donViTinh: string
  giaBan: number
  soLuongHienCo: number
  nguongCanhBao: number | null
  thoiGianCapNhat: string
  trangThaiSanPham: string
}

export type BienDongKho = {
  id: number
  idTonKho: number
  tenChiNhanh: string
  maSanPham: string
  tenSanPham: string
  loaiBienDong: string
  soLuongThayDoi: number
  maChungTu: string | null
  lyDo: string | null
  tenNguoiThucHien: string | null
  thoiGianTao: string
}

async function docJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let thongBao = `Yêu cầu thất bại (HTTP ${response.status}).`

    if (response.status === 401) {
      thongBao = 'Phiên đăng nhập đã hết hạn.'
    } else if (response.status === 403) {
      thongBao = 'Bạn không có quyền xem dữ liệu này.'
    } else {
      try {
        const body = await response.json()
        thongBao =
          body.detail ?? body.message ?? body.thongBao ?? thongBao
      } catch {
        // Giữ thông báo mặc định.
      }
    }

    throw new Error(thongBao)
  }

  return response.json() as Promise<T>
}

export async function layDanhSachTonKho(
  signal?: AbortSignal,
): Promise<TonKho[]> {
  const response = await fetch('/api/ton-kho', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<TonKho[]>(response)
}

export async function layLichSuBienDong(
  signal?: AbortSignal,
): Promise<BienDongKho[]> {
  const response = await fetch('/api/ton-kho/bien-dong', {
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  })

  return docJson<BienDongKho[]>(response)
}
