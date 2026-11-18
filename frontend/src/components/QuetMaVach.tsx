import { useEffect, useId, useRef, useState } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'

type Props = {
  onQuetDuoc: (maVach: string) => void | boolean | Promise<void | boolean>
  onDong: () => void
  lienTuc?: boolean
}

export default function QuetMaVach({
  onQuetDuoc,
  onDong,
  lienTuc = false,
}: Props) {
  const idCamera = `camera-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const khiQuetDuoc = useRef(onQuetDuoc)
  const [loi, setLoi] = useState('')
  const [sanSang, setSanSang] = useState(false)

  useEffect(() => {
    khiQuetDuoc.current = onQuetDuoc
  }, [onQuetDuoc])

  useEffect(() => {
    let daDong = false
    let daQuetMotLan = false
    let dangGui = false
    let maTrongKhung = ''
    let batDauMatMa: number | null = null
    let mayQuet: Html5Qrcode | undefined

    setLoi('')
    setSanSang(false)

    async function nhanMa(noiDung: string) {
      if (daDong || (!lienTuc && daQuetMotLan)) return

      const ma = noiDung.trim()
      if (!ma) return

      batDauMatMa = null
      if (dangGui || ma === maTrongKhung) return

      maTrongKhung = ma

      if (ma.length > 100) {
        setLoi('Mã quá dài. Vui lòng quét tem mã vạch sản phẩm.')
        return
      }

      dangGui = true
      setLoi('')

      try {
        const ketQua = await khiQuetDuoc.current(ma)

        if (ketQua === false) {
          // Trang bán hàng đang xử lý lượt nhập khác.
          maTrongKhung = ''
        } else {
          daQuetMotLan = true
        }
      } catch {
        if (!daDong) setLoi('Không xử lý được mã vừa đọc.')
      } finally {
        dangGui = false
      }
    }

    function khongDocDuocMa() {
      if (daDong || !lienTuc || !maTrongKhung) return

      const hienTai = performance.now()
      if (batDauMatMa === null) {
        batDauMatMa = hienTai
      } else if (hienTai - batDauMatMa >= 900) {
        maTrongKhung = ''
      }
    }

    async function moCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Hãy mở trang bằng localhost hoặc HTTPS để dùng camera.')
        }

        const { Html5Qrcode, Html5QrcodeSupportedFormats: Format } =
          await import('html5-qrcode')

        if (daDong) return

        mayQuet = new Html5Qrcode(idCamera, {
          verbose: false,
          formatsToSupport: [
            Format.EAN_13,
            Format.EAN_8,
            Format.UPC_A,
            Format.UPC_E,
            Format.CODE_128,
            Format.CODE_39,
            Format.ITF,
          ],
        })

        await mayQuet.start(
          { facingMode: 'environment' },
          { fps: 10 },
          (ma) => void nhanMa(ma),
          khongDocDuocMa,
        )

        if (!daDong) setSanSang(true)
      } catch (error) {
        if (daDong) return

        const chiTiet = error instanceof Error
          ? `${error.name} ${error.message}`
          : String(error)

        if (/NotAllowed|Permission denied/i.test(chiTiet)) {
          setLoi('Camera đang bị chặn. Cho phép truy cập rồi đóng và mở lại camera.')
        } else if (/NotFound|DevicesNotFound/i.test(chiTiet)) {
          setLoi('Không tìm thấy camera. Bạn có thể nhập mã bằng tay.')
        } else if (/NotReadable|TrackStart/i.test(chiTiet)) {
          setLoi('Camera đang bận. Đóng ứng dụng dùng camera rồi thử lại.')
        } else {
          setLoi(`Không mở được camera. ${chiTiet}`)
        }
      }
    }

    const khoiDong = moCamera()

    return () => {
      daDong = true

      void khoiDong.then(async () => {
        if (mayQuet?.isScanning) await mayQuet.stop()
      }).catch((error) => console.error('Lỗi khi đóng camera', error))
    }
  }, [idCamera, lienTuc])

  return (
    <div className="border rounded-3 bg-light p-2 mt-3">
      <div className="d-flex flex-wrap align-items-center gap-3">
        <div
          className="position-relative overflow-hidden rounded-2 bg-dark"
          style={{
            width: 256,
            maxWidth: '100%',
            aspectRatio: '16 / 9',
            flexShrink: 0,
          }}
        >
          <div
            id={idCamera}
            className="w-100 position-absolute top-50 start-0 translate-middle-y"
          />

          {!sanSang && !loi && (
            <div className="position-absolute top-50 start-50 translate-middle text-white small text-nowrap">
              Đang mở camera…
            </div>
          )}
        </div>

        <div className="flex-grow-1" style={{ flexBasis: 150, minWidth: 0 }}>
          <div className="fw-semibold">Quét mã vạch</div>
          <p className="small text-secondary my-1">
            Đặt dãy vạch vào giữa khung hình.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mt-1"
            onClick={onDong}
          >
            Đóng camera
          </button>
        </div>
      </div>

      {loi && (
        <p className="small text-danger mt-2 mb-0" role="alert">{loi}</p>
      )}
    </div>
  )
}