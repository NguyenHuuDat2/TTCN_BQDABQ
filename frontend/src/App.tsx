
import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('Đang kết nối...')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Backend error')
        }
        return response.json()
      })
      .then((data) => {
        setMessage(data.message)
        setConnected(data.status === 'success')
      })
      .catch(() => {
        setMessage('Không thể kết nối Backend')
        setConnected(false)
      })
  }, [])

  return (
    <div style={{
      textAlign: 'center',
      padding: '60px',
      fontFamily: 'Arial'
    }}>
      <h1>HỆ THỐNG QUẢN LÝ BÁN HÀNG POS</h1>
      <h2>React + TypeScript + Spring Boot</h2>

      <p>
        Trạng thái kết nối:
        <strong style={{
          color: connected ? 'green' : 'red'
        }}>
          {connected ? ' Thành công' : ' Chưa kết nối'}
        </strong>
      </p>

      <p>{message}</p>
    </div>
  )
}

export default App
