import { useEffect, useState } from 'react'
import { obtenerEstadoActualizacion, aplicarActualizacion } from '../api/actualizacion'
import { confirmar } from '../lib/confirmar'
import { notificarError } from '../lib/toasts'
import './AvisoActualizacion.css'

function AvisoActualizacion() {
  const [estado, setEstado] = useState(null)
  const [aplicando, setAplicando] = useState(false)

  useEffect(() => {
    consultar()
    const intervalo = setInterval(consultar, 2 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  async function consultar() {
    try {
      const datos = await obtenerEstadoActualizacion()
      setEstado(datos)
    } catch {
      // si falla la consulta, simplemente no mostramos nada, no es critico
    }
  }

  async function manejarAplicar() {
    const confirmado = await confirmar(
      `Hay una actualización lista (versión ${estado.versionDisponible}). El programa se va a cerrar solo para instalarla. Tenés que volver a abrirlo desde el acceso directo cuando termine. ¿Continuar?`,
      { textoConfirmar: 'Actualizar ahora' }
    )
    if (!confirmado) return

    setAplicando(true)
    const resultado = await aplicarActualizacion()

    if (!resultado.ok) {
      notificarError(resultado.mensaje || 'No se pudo aplicar la actualizacion')
      setAplicando(false)
    }
    // si resultado.ok es true, el backend se va a cerrar solo en 1 segundo,
    // no hace falta hacer nada mas aca
  }

  if (!estado || !estado.listaParaInstalar) return null

  return (
    <div className="aviso-actualizacion">
      <div className="aviso-actualizacion-icono">✓</div>
      <div className="aviso-actualizacion-texto">
        <strong>Actualización disponible</strong>
        <span>Versión {estado.versionDisponible} lista para instalar</span>
      </div>
      <button onClick={manejarAplicar} disabled={aplicando} className="aviso-actualizacion-boton">
        {aplicando ? 'Instalando...' : 'Actualizar ahora'}
      </button>
    </div>
  )

}

export function EtiquetaVersion() {
  const [version, setVersion] = useState(null)

  useEffect(() => {
    obtenerEstadoActualizacion()
      .then((datos) => setVersion(datos.versionActual))
      .catch(() => {})
  }, [])

  if (!version) return null

  return <small className="etiqueta-version">v{version}</small>
}

export default AvisoActualizacion