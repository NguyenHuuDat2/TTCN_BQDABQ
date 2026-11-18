
import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, RefreshCw, Save } from 'lucide-react'
import {
  layNhanVienThuNgan,
  layDanhSachCa,
  phanCongCa,
  type CaLamViec,
  type NhanVienThuNgan,
} from './quanLyCaApi'

function ngayHomNay() {
  const ngay = new Date()

  return [
    ngay.getFullYear(),
    String(ngay.getMonth() + 1).padStart(2, '0'),
    String(ngay.getDate()).padStart(2, '0'),
  ].join('-')
}

function hienNgay(value: string) {
  const [nam, thang, ngay] = value.split('-')
  return `${ngay}/${thang}/${nam}`
}

function tenLoaiCa(value: string) {
  const ten: Record<string, string> = {
    SANG: 'Ca sáng',
    CHIEU: 'Ca chiều',
    TOI: 'Ca tối',
  }

  return ten[value] ?? value
}

function loiTu(error: unknown) {
  return error instanceof Error ? error.message : 'Có lỗi xảy ra.'
}

function trangThaiCa(ca: CaLamViec) {
  if (ca.coPhien) return 'Đã phát sinh phiên'
  if (ca.trangThai === 'KET_THUC') return 'Đã kết thúc'
  if (ca.idTaiKhoanThuNgan) return 'Đã phân công'
  return 'Chưa phân công'
}

function mauTrangThai(ca: CaLamViec) {
  if (ca.coPhien || ca.trangThai === 'KET_THUC') {
    return 'text-bg-success'
  }

  if (ca.idTaiKhoanThuNgan) {
    return 'text-bg-primary'
  }

  return 'text-bg-warning'
}

export default function QuanLyCaPage() {
  const [ngay, setNgay] = useState(ngayHomNay())

  const [nhanVien, setNhanVien] = useState<NhanVienThuNgan[]>([])
  const [danhSachCa, setDanhSachCa] = useState<CaLamViec[]>([])

  const [nhanVienChon, setNhanVienChon] =
    useState<Record<string, string>>({})

  const [dangTai, setDangTai] = useState(true)
  const [dangLuu, setDangLuu] = useState<string | null>(null)

  const [loi, setLoi] = useState('')
  const [thongBao, setThongBao] = useState('')

  const ngayQua = ngay < ngayHomNay()

  useEffect(() => {
    const controller = new AbortController()

    async function taiDuLieu() {
      setDangTai(true)
      setLoi('')

      try {
        const [dsNhanVien, dsCa] = await Promise.all([
          layNhanVienThuNgan(controller.signal),
          layDanhSachCa(ngay, controller.signal),
        ])

        if (controller.signal.aborted) return

        setNhanVien(dsNhanVien)
        setDanhSachCa(dsCa)

        const luaChon: Record<string, string> = {}

        dsCa.forEach((ca) => {
          luaChon[ca.loaiCa] = ca.idTaiKhoanThuNgan
            ? String(ca.idTaiKhoanThuNgan)
            : ''
        })

        setNhanVienChon(luaChon)
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

    void taiDuLieu()

    return () => controller.abort()
  }, [ngay])

  async function luuPhanCong(ca: CaLamViec) {
    if (dangLuu) return

    const idNhanVien = nhanVienChon[ca.loaiCa]

    if (!idNhanVien) {
      setLoi(`Vui lòng chọn thu ngân cho ${tenLoaiCa(ca.loaiCa)}.`)
      return
    }

    setLoi('')
    setThongBao('')
    setDangLuu(ca.loaiCa)

    try {
      const ketQua = await phanCongCa({
        ngayLamViec: ngay,
        loaiCa: ca.loaiCa,
        idTaiKhoanThuNgan: Number(idNhanVien),
      })

      setDanhSachCa((ds) =>
        ds.map((item) =>
          item.loaiCa === ketQua.loaiCa ? ketQua : item,
        ),
      )

      setNhanVienChon((ds) => ({
        ...ds,
        [ketQua.loaiCa]: String(
          ketQua.idTaiKhoanThuNgan ?? '',
        ),
      }))

      setThongBao(
        `Đã phân công ${ketQua.tenThuNgan} vào ${tenLoaiCa(ca.loaiCa)} ngày ${hienNgay(ngay)}.`,
      )
    } catch (error) {
      setLoi(loiTu(error))
    } finally {
      setDangLuu(null)
    }
  }

  return (
    <section className="container-fluid p-3 p-lg-4 text-start">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">
            Quản lý ca làm việc
          </h1>
          <p className="text-secondary mb-0">
            Phân công nhân viên thu ngân theo lịch ca cố định.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary d-flex align-items-center gap-2"
          disabled={dangTai}
          onClick={() => setNgay((value) => value)}
        >
          <RefreshCw size={17} />
          Làm mới
        </button>
      </div>

      {loi && (
        <div className="alert alert-danger" role="alert">
          {loi}
        </div>
      )}

      {thongBao && (
        <div className="alert alert-success" role="status">
          {thongBao}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row align-items-end g-3">
            <div className="col-12 col-md-5 col-lg-4">
              <label className="form-label fw-semibold">
                <CalendarDays size={17} className="me-2" />
                Ngày làm việc
              </label>

              <input
                type="date"
                className="form-control"
                value={ngay}
                onChange={(event) => {
                  setNgay(event.target.value)
                  setLoi('')
                  setThongBao('')
                }}
              />
            </div>

            <div className="col-12 col-md-7 col-lg-8">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setNgay(ngayHomNay())
                    setLoi('')
                    setThongBao('')
                  }}
                >
                  Hôm nay
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 gap-2">
            <div>
              <h2 className="h5 fw-bold mb-1">
                Lịch phân công ngày {hienNgay(ngay)}
              </h2>
              <p className="text-secondary small mb-0">
                Ba ca làm việc được thiết lập sẵn. Chỉ cần chọn nhân viên.
              </p>
            </div>

            <span className="badge text-bg-primary">
              {nhanVien.length} thu ngân hoạt động
            </span>
          </div>
        </div>
      </div>

      {!dangTai && nhanVien.length === 0 && (
        <div className="alert alert-warning">
          Không tìm thấy thu ngân đang hoạt động tại chi nhánh này.
          Vui lòng kiểm tra tài khoản nhân viên và chi nhánh.
        </div>
      )}

      {dangTai ? (
        <div className="text-center text-secondary py-5">
          Đang tải lịch làm việc...
        </div>
      ) : (
        <div className="row g-3">
          {danhSachCa.map((ca) => {
            const idChon = nhanVienChon[ca.loaiCa] ?? ''

            const daLuu =
              ca.idTaiKhoanThuNgan !== null &&
              idChon === String(ca.idTaiKhoanThuNgan)

            const khoaPhanCong =
              ca.coPhien ||
              ca.trangThai === 'KET_THUC' ||
              ngayQua

            return (
              <div
                className="col-12 col-lg-4"
                key={ca.loaiCa}
              >
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h3 className="h5 fw-bold mb-1">
                          {tenLoaiCa(ca.loaiCa)}
                        </h3>

                        <div className="text-secondary">
                          <Clock3
                            size={15}
                            className="me-2"
                          />
                          {ca.gioBatDau} – {ca.gioKetThuc}
                        </div>
                      </div>

                      <span className={`badge ${mauTrangThai(ca)}`}>
                        {trangThaiCa(ca)}
                      </span>
                    </div>

                    <hr />

                    <label className="form-label fw-semibold">
                      Nhân viên thu ngân
                    </label>

                    <select
                      className="form-select mb-3"
                      value={idChon}
                      disabled={
                        dangLuu !== null ||
                        khoaPhanCong ||
                        nhanVien.length === 0
                      }
                      onChange={(event) => {
                        setNhanVienChon((ds) => ({
                          ...ds,
                          [ca.loaiCa]: event.target.value,
                        }))
                        setThongBao('')
                        setLoi('')
                      }}
                    >
                      <option value="">
                        -- Chọn thu ngân --
                      </option>

                      {nhanVien.map((nv) => (
                        <option
                          key={nv.id}
                          value={nv.id}
                        >
                          {nv.hoTen} ({nv.tenDangNhap})
                        </option>
                      ))}
                    </select>

                    {ca.tenThuNgan && (
                      <div className="small text-secondary mb-3">
                        Đang phân công: {ca.tenThuNgan}
                      </div>
                    )}

                    <button
                      type="button"
                      className={`btn w-100 ${
                        daLuu
                          ? 'btn-outline-success'
                          : 'btn-primary'
                      }`}
                      disabled={
                        dangLuu !== null ||
                        khoaPhanCong ||
                        !idChon ||
                        daLuu
                      }
                      onClick={() => void luuPhanCong(ca)}
                    >
                      <Save size={17} className="me-2" />

                      {dangLuu === ca.loaiCa
                        ? 'Đang lưu...'
                        : daLuu
                          ? 'Đã phân công'
                          : ca.idTaiKhoanThuNgan
                            ? 'Cập nhật phân công'
                            : 'Lưu phân công'}
                    </button>

                    {ca.coPhien && (
                      <p className="small text-success mt-3 mb-0">
                        Ca đã phát sinh phiên thu ngân. Không thể thay đổi nhân viên.
                      </p>
                    )}

                    {ngayQua && (
                      <p className="small text-secondary mt-3 mb-0">
                        Không thể thay đổi lịch của ngày đã qua.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="small text-secondary mt-4">
        Lịch ca được hiển thị sẵn. Dữ liệu ca và phân công sẽ được lưu
        vào cơ sở dữ liệu khi bạn xác nhận phân công.
      </div>
    </section>
  )
}
