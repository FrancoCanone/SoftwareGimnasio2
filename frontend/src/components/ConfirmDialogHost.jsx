import { useEffect, useState } from 'react'
import { registrarDialogoConfirmacion } from '../lib/confirmar'
import './ConfirmDialogHost.css'

function ConfirmDialogHost() {
  const [dialogo, setDialogo] = useState(null)

  useEffect(() => {
    registrarDialogoConfirmacion((mensaje, opciones) => {
      return new Promise((resolve) => {
        setDialogo({ mensaje, opciones, resolve })
      })
    })
  }, [])

  function responder(valor) {
    dialogo.resolve(valor)
    setDialogo(null)
  }

  if (!dialogo) return null

  return (
    <div className="confirm-overlay">
      <div className="confirm-card">
        <p>{dialogo.mensaje}</p>
        <div className="confirm-botones">
          <button className="planes-boton-secundario" onClick={() => responder(false)}>
            {dialogo.opciones.textoCancelar || 'Cancelar'}
          </button>
          <button className="confirm-boton-peligro" onClick={() => responder(true)}>
            {dialogo.opciones.textoConfirmar || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialogHost