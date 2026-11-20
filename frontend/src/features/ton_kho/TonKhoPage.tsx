
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Package,
  RefreshCw,
  Search,
  Warehouse,
} from 'lucide-react'
import {
  layDanhSachTonKho,
  layLichSuBienDong,
  type TonKho,
  type BienDongKho,
} from './tonKhoApi'

const hienTien = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value) + ' đ'

const hienThoiGian = (value: string) =>
  new Date(value).toLocaleString('vi-VN')

function loiTu(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Không tải được dữ liệu tồn kho.'
}

function tenBienDong(value: string) {
  const ten: Record<string, string> = {
    BAN_HANG: 'Bán hàng',
    DIEU_CHUYEN_XUAT: 'Xuất điều chuyển',
    DIEU_CHUYEN_NHAN: 'Nhận điều chuyển',
    NHAP_HANG: 'Nhập hàng',
  }

  return ten[value] ?? value
}

function trangThaiKho(item: TonKho) {
  if (item.soLuongHienCo <= 0) return 'Hết hàng'

  if (
    item.nguongCanhBao !== null &&
    item.soLuongHienCo <= item.nguongCanhBao
  ) {
    return 'Sắp hết'
  }

  return 'Còn hàng'
}

export default function TonKhoPage() {
  const [danhSach, setDanhSach] = useState<TonKho[]>([])
  const [bienDong, setBienDong] = useState<BienDongKho[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState('')
  const [tuKhoa, setTuKhoa] = useState('')
  const [idChiNhanh, setIdChiNhanh] = useState('ALL')
  const [chiXemCanhBao, setChiXemCanhBao] = useState(false)

  async function taiDuLieu(signal?: AbortSignal) {
    const [tonKho, lichSu] = await Promise.all([
      layDanhSachTonKho(signal),
      layLichSuBienDong(signal),
    ])

    if (!signal?.aborted) {
      setDanhSach(tonKho)
      setBienDong(lichSu)
      setLoi('')
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    async function khoiTao() {
      try {
        await taiDuLieu(controller.signal)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoi(loiTu(error))
        }
      } finally {
        if (!controller.signal.aborted) {
          setDangTai(false)
        }
      }
    }

    void khoiTao()

    return () => controller.abort()
  }, [])

  async function lamMoi() {
    setDangTai(true)
    setLoi('')

    try {
      await taiDuLieu()
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangTai(false)
    }
  }

  const chiNhanh = useMemo(() => {
    const map = new Map<number, string>()

    danhSach.forEach((item) => {
      map.set(item.idChiNhanh, item.tenChiNhanh)
    })

    return Array.from(map, ([id, tenChiNhanh]) => ({
      id,
      tenChiNhanh,
    }))
  }, [danhSach])

  const ketQua = useMemo(() => {
    const tim = tuKhoa.trim().toLowerCase()

    return danhSach.filter((item) => {
      const dungChiNhanh =
        idChiNhanh === 'ALL' ||
        item.idChiNhanh === Number(idChiNhanh)

      const dungTuKhoa =
        !tim ||
        [
          item.tenSanPham,
          item.maSanPham,
          item.maVach ?? '',
        ].some((value) => value.toLowerCase().includes(tim))

      const dungCanhBao =
        !chiXemCanhBao ||
        item.soLuongHienCo <= 0 ||
        (
          item.nguongCanhBao !== null &&
          item.soLuongHienCo <= item.nguongCanhBao
        )

      return dungChiNhanh && dungTuKhoa && dungCanhBao
    })
  }, [danhSach, tuKhoa, idChiNhanh, chiXemCanhBao])

  const tongSoLuong = danhSach.reduce(
    (tong, item) => tong + item.soLuongHienCo,
    0,
  )

  const soHetHang = danhSach.filter(
    (item) => item.soLuongHienCo <= 0,
  ).length

  const soSapHet = danhSach.filter(
    (item) =>
      item.soLuongHienCo > 0 &&
      item.nguongCanhBao !== null &&
      item.soLuongHienCo <= item.nguongCanhBao,
  ).length

  const lichSuLoc = bienDong.filter((item) => {
    return (
      idChiNhanh === 'ALL' ||
      danhSach.some(
        (k) =>
          k.id === item.idTonKho &&
          k.idChiNhanh === Number(idChiNhanh),
      )
    )
  })

  return (
    <section className="container-fluid p-3 p-lg-4 text-start">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">
            Quản lý tồn kho
          </h1>
          <p className="text-secondary mb-0">
            Theo dõi số lượng sản phẩm tại từng chi nhánh.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => void lamMoi()}
          disabled={dangTai}
        >
          <RefreshCw size={16} className="me-2" />
          Làm mới
        </button>
      </div>

      {loi && (
        <div className="alert alert-danger py-2" role="alert">
          {loi}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-primary bg-opacity-10 p-3 text-primary">
                <Package size={25} />
              </div>
              <div>
                <div className="small text-secondary">
                  Tổng mặt hàng theo chi nhánh
                </div>
                <div className="h4 fw-bold mb-0">
                  {danhSach.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-success bg-opacity-10 p-3 text-success">
                <Warehouse size={25} />
              </div>
              <div>
                <div className="small text-secondary">
                  Tổng số lượng tồn
                </div>
                <div className="h4 fw-bold mb-0">
                  {tongSoLuong.toLocaleString('vi-VN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-warning bg-opacity-10 p-3 text-warning">
                <AlertTriangle size={25} />
              </div>
              <div>
                <div className="small text-secondary">
                  Cần chú ý
                </div>
                <div className="h4 fw-bold mb-0">
                  {soSapHet + soHetHang}
                </div>
                <div className="small text-secondary">
                  {soSapHet} sắp hết · {soHetHang} hết hàng
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <h2 className="h5 fw-semibold mb-0">
              Danh sách tồn kho
            </h2>
            <span className="badge text-bg-primary">
              {ketQua.length} kết quả
            </span>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-12 col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={17} />
                </span>
                <input
                  className="form-control"
                  placeholder="Tìm tên, mã sản phẩm hoặc mã vạch..."
                  value={tuKhoa}
                  onChange={(e) => setTuKhoa(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <select
                className="form-select"
                value={idChiNhanh}
                onChange={(e) => setIdChiNhanh(e.target.value)}
              >
                <option value="ALL">Tất cả chi nhánh</option>
                {chiNhanh.map((cn) => (
                  <option key={cn.id} value={cn.id}>
                    {cn.tenChiNhanh}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <button
                type="button"
                className={`btn w-100 ${
                  chiXemCanhBao
                    ? 'btn-warning'
                    : 'btn-outline-warning'
                }`}
                onClick={() =>
                  setChiXemCanhBao((value) => !value)
                }
              >
                <AlertTriangle size={16} className="me-2" />
                {chiXemCanhBao
                  ? 'Đang lọc cảnh báo'
                  : 'Chỉ xem cảnh báo'}
              </button>
            </div>
          </div>

          {dangTai ? (
            <div className="text-center text-secondary py-5">
              Đang tải dữ liệu tồn kho...
            </div>
          ) : ketQua.length === 0 ? (
            <div className="text-center text-secondary py-5">
              Không có dữ liệu tồn kho phù hợp.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Chi nhánh</th>
                    <th>Giá bán</th>
                    <th className="text-center">Tồn hiện có</th>
                    <th className="text-center">Ngưỡng cảnh báo</th>
                    <th>Trạng thái</th>
                    <th>Cập nhật</th>
                  </tr>
                </thead>

                <tbody>
                  {ketQua.map((item) => {
                    const trangThai = trangThaiKho(item)

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-semibold">
                            {item.tenSanPham}
                          </div>
                          <div className="small text-secondary">
                            {item.maSanPham}
                            {item.maVach
                              ? ` · ${item.maVach}`
                              : ''}
                          </div>
                        </td>

                        <td>{item.tenChiNhanh}</td>

                        <td className="text-nowrap">
                          {hienTien(item.giaBan)}
                        </td>

                        <td className="text-center">
                          <span className={`fw-bold ${
                            item.soLuongHienCo <= 0
                              ? 'text-danger'
                              : 'text-body'
                          }`}>
                            {item.soLuongHienCo}
                          </span>
                          <span className="small text-secondary ms-1">
                            {item.donViTinh}
                          </span>
                        </td>

                        <td className="text-center">
                          {item.nguongCanhBao ?? '—'}
                        </td>

                        <td>
                          <span className={`badge ${
                            trangThai === 'Hết hàng'
                              ? 'text-bg-danger'
                              : trangThai === 'Sắp hết'
                                ? 'text-bg-warning'
                                : 'text-bg-success'
                          }`}>
                            {trangThai}
                          </span>
                        </td>

                        <td className="small text-secondary text-nowrap">
                          {hienThoiGian(item.thoiGianCapNhat)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <div>
              <h2 className="h5 fw-semibold mb-1">
                Lịch sử biến động kho
              </h2>
              <p className="small text-secondary mb-0">
                100 giao dịch gần nhất.
              </p>
            </div>
          </div>

          {dangTai ? (
            <p className="text-secondary mb-0">
              Đang tải lịch sử...
            </p>
          ) : lichSuLoc.length === 0 ? (
            <div className="text-center text-secondary py-4">
              Chưa có lịch sử biến động kho.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Thời gian</th>
                    <th>Sản phẩm</th>
                    <th>Chi nhánh</th>
                    <th>Loại biến động</th>
                    <th className="text-center">Số lượng</th>
                    <th>Chứng từ</th>
                    <th>Người thực hiện</th>
                  </tr>
                </thead>

                <tbody>
                  {lichSuLoc.map((item) => (
                    <tr key={item.id}>
                      <td className="small text-nowrap">
                        {hienThoiGian(item.thoiGianTao)}
                      </td>

                      <td>
                        <div className="fw-semibold">
                          {item.tenSanPham}
                        </div>
                        <div className="small text-secondary">
                          {item.maSanPham}
                        </div>
                      </td>

                      <td>{item.tenChiNhanh}</td>

                      <td>{tenBienDong(item.loaiBienDong)}</td>

                      <td className="text-center fw-semibold">
                        <span className={
                          item.soLuongThayDoi < 0
                            ? 'text-danger'
                            : 'text-success'
                        }>
                          {item.soLuongThayDoi > 0 ? '+' : ''}
                          {item.soLuongThayDoi}
                        </span>
                      </td>

                      <td className="small">
                        {item.maChungTu || '—'}
                        {item.lyDo && (
                          <div className="text-secondary">
                            {item.lyDo}
                          </div>
                        )}
                      </td>

                      <td className="small">
                        {item.tenNguoiThucHien || 'Hệ thống'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
