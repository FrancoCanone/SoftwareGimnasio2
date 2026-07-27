import { useEffect, useState } from 'react'
import { suscribirseAToasts } from '../lib/toasts'
import './ToastContainer.css'

function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return suscribirseAToasts((toast) => {
      setToasts((anteriores) => [...anteriores, toast])
      setTimeout(() => {
        setToasts((anteriores) => anteriores.filter((t) => t.id !== toast.id))
      }, toast.duracionMs)
    })
  }, [])

  function cerrar(id) {
    setToasts((anteriores) => anteriores.filter((t) => t.id !== id))
  }

  return (
    <div className="toast-contenedor">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tipo}`} onClick={() => cerrar(toast.id)}>
          {toast.mensaje}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer