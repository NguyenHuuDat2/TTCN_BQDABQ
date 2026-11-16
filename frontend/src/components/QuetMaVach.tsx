import { useEffect, useId, useRef, useState } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'

type Props = {
  onQuetDuoc: (maVach: string) => void
  onDong: () => void
}

export default function QuetMaVach({ onQuetDuoc, onDong }: Props) {
  const idCamera = `camera-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const khiQuetDuoc = useRef(onQuetDuoc)
  const [loi, setLoi] = useState('')

  useEffect(() => {
    khiQuetDuoc.current = onQuetDuoc
  }, [onQuetDuoc])

  useEffect(() => {
    let daDong = false
    let daNhanMa = false
    let mayQuet: Html5Qrcode | undefined

    async function moCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Trình duyệt cần localhost hoặc HTTPS để mở camera.')
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
          (noiDung) => {
            const ma = noiDung.trim()

            if (daDong || daNhanMa || !ma) return

            if (ma.length > 100) {
              setLoi('Mã vừa đọc dài hơn 100 ký tự. Vui lòng quét tem mã vạch sản phẩm.')
              return
            }

            daNhanMa = true
            khiQuetDuoc.current(ma)
          },
          () => {},
        )
      } catch (error) {
        if (daDong) return

        const chiTiet = error instanceof Error ? error.message : String(error)

        if (/NotAllowed|Permission denied/i.test(chiTiet)) {
          setLoi('Camera đang bị chặn. Hãy cho phép trang dùng camera rồi mở lại.')
        } else if (/NotFound|DevicesNotFound/i.test(chiTiet)) {
          setLoi('Không tìm thấy camera. Hãy kiểm tra camera hoặc nhập mã bằng tay.')
        } else {
          setLoi(`Không mở được camera. ${chiTiet}`)
        }
      }
    }

    const khoiDong = moCamera()

    return () => {
      daDong = true

      void khoiDong.then(async () => {
        if (mayQuet?.isScanning) {
          await mayQuet.stop()
        }
      }).catch((error) => console.error('Lỗi khi đóng camera', error))
    }
  }, [idCamera])

  return (
    <div className="border rounded-3 bg-light p-3 mt-2">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <span className="fw-semibold">Quét mã vạch sản phẩm</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onDong}
        >
          Đóng camera
        </button>
      </div>

      <div id={idCamera} className="w-100 overflow-hidden rounded" />

      {loi ? (
        <p className="text-danger small mt-2 mb-0" role="alert">{loi}</p>
      ) : (
        <p className="text-secondary small mt-2 mb-0">
          Đưa toàn bộ dãy vạch trên bao bì vào khung hình và giữ yên.
        </p>
      )}
    </div>
  )
}