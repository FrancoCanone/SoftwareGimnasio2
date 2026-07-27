import { useEffect, useRef, useState } from 'react'
import { buscarClientePorDni } from '../api/clientes'
import { registrarAsistencia } from '../api/asistencias'
import { obtenerUltimoPagoCliente } from '../api/pagos'
import { marcarIngresoActivo, marcarIngresoCerrado } from '../api/sistema'
import './Ingreso.css'

const SEGUNDOS_CIERRE = 6

function formatearFecha(fechaIso) {
  if (!fechaIso) return '-'
  const [anio, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}/${anio}`
}

function Ingreso() {
  const [dni, setDni] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_CIERRE)

  const inputRef = useRef(null)
  const intervaloRef = useRef(null)

  const [horaActual, setHoraActual] = useState('')

  function alternarPantallaCompleta() {
    if (!document.fullscreenElement) {
      const elemento = document.documentElement
      const pedirFullscreen =
        elemento.requestFullscreen ||
        elemento.webkitRequestFullscreen ||
        elemento.msRequestFullscreen

      if (pedirFullscreen) {
        pedirFullscreen.call(elemento).catch((err) => {
          window.alert('No se pudo activar pantalla completa: ' + err.message)
        })
      } else {
        window.alert('Este navegador no soporta pantalla completa en este modo')
      }
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    function actualizarHora() {
      const ahora = new Date()
      setHoraActual(ahora.toLocaleTimeString('es-AR', { hour12: false }))
    }
    actualizarHora()
    const intervaloReloj = setInterval(actualizarHora, 1000)
    return () => clearInterval(intervaloReloj)
  }, [])

  const fechaHoy = new Date()
  const diaSemana = fechaHoy.toLocaleDateString('es-AR', { weekday: 'long' })
  const fechaCorta = fechaHoy.toLocaleDateString('es-AR')
  const fechaCompleta = `${diaSemana} ${fechaCorta}`.toUpperCase()

  useEffect(() => {
    enfocarInput()
  }, [])

  useEffect(() => {
    const canal = new BroadcastChannel('ingreso-estado')

    function avisarActivo() {
      canal.postMessage({ tipo: 'activo' })
    }

    function avisarInactivo() {
      canal.postMessage({ tipo: 'inactivo' })
    }

    avisarActivo()

    window.addEventListener('focus', avisarActivo)
    window.addEventListener('blur', avisarInactivo)
    window.addEventListener('beforeunload', avisarInactivo)

    return () => {
      avisarInactivo()
      window.removeEventListener('focus', avisarActivo)
      window.removeEventListener('blur', avisarInactivo)
      window.removeEventListener('beforeunload', avisarInactivo)
      canal.close()
    }
  }, [])

  useEffect(() => {
    marcarIngresoActivo()
    const intervaloLatido = setInterval(marcarIngresoActivo, 5000)

    function avisarCierre() {
      marcarIngresoCerrado()
    }
    window.addEventListener('beforeunload', avisarCierre)

    return () => {
      clearInterval(intervaloLatido)
      avisarCierre()
      window.removeEventListener('beforeunload', avisarCierre)
    }
  }, [])

  function enfocarInput() {
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function limpiarIntervalo() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }

  function cerrarResultado() {
    limpiarIntervalo()
    setResultado(null)
    enfocarInput()
  }

  function iniciarCuentaRegresiva() {
    limpiarIntervalo()
    setSegundosRestantes(SEGUNDOS_CIERRE)

    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((anterior) => {
        if (anterior <= 1) {
          cerrarResultado()
          return SEGUNDOS_CIERRE
        }
        return anterior - 1
      })
    }, 1000)
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    const dniLimpio = dni.trim()
    if (!dniLimpio || buscando) return

    setBuscando(true)
    setDni('')

    try {
      const cliente = await buscarClientePorDni(dniLimpio)

      if (!cliente) {
        setResultado({
          permitido: false,
          nombre: '',
          apellido: '',
          dni: dniLimpio,
          plan: null,
          mensajeEstado: 'SIN REGISTRO',
        })
        iniciarCuentaRegresiva()
        return
      }

      const ultimoPago = await obtenerUltimoPagoCliente(cliente.id)

      if (!ultimoPago) {
        setResultado({
          permitido: false,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          dni: cliente.dni,
          plan: null,
          mensajeEstado: 'SIN PAGO',
        })
        iniciarCuentaRegresiva()
        return
      }

      const asistencia = await registrarAsistencia(cliente.id)
      const permitido = asistencia.estado === 'ACEPTADO'

      const canalEventos = new BroadcastChannel('gimnasio-eventos')
      canalEventos.postMessage({ tipo: 'asistencia-registrada' })
      canalEventos.close()

      setResultado({
        permitido,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni: cliente.dni,
        plan: ultimoPago.plan.nombre,
        mensajeEstado: permitido
          ? `SE VENCE EL ${formatearFecha(ultimoPago.fechaVencimiento)}`
          : `CUOTA VENCIDA EL ${formatearFecha(ultimoPago.fechaVencimiento)}`,
      })
      iniciarCuentaRegresiva()
    } catch (err) {
      setResultado({
        permitido: false,
        nombre: '',
        apellido: '',
        dni: dniLimpio,
        plan: null,
        mensajeEstado: 'ERROR AL VERIFICAR',
      })
      iniciarCuentaRegresiva()
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="ingreso-pantalla" onDoubleClick={alternarPantallaCompleta}>
      <div className="ingreso-topbar">
        <span>{fechaCompleta}</span>
        <span>{horaActual}</span>
      </div>

      
      {!resultado && (
        <form className="ingreso-form" onSubmit={manejarEnvio}>
          <img src="/IMAGEM-GYM.jpg" alt="Imagen Gimnasio" className="ingreso-icono" />
          <p>Escribí tu DNI</p>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="DNI"
            autoFocus
          />
          {buscando && <p className="ingreso-cargando">Verificando...</p>}
        </form>
      )}

      {resultado && (
        <div className="ingreso-card">
          <div className={`ingreso-banner ${resultado.permitido ? 'ingreso-banner-aceptado' : 'ingreso-banner-rechazado'}`}>
            Bienvenido
          </div>

          <div className="ingreso-datos">
            <img src="/icons8-person-64.png" alt="" className="ingreso-datos-icono" />
            <div className="ingreso-info">
             <p>
                <span><strong>Nombre:</strong> {resultado.nombre || '-'}</span>
                <span><strong>Apellido:</strong> {resultado.apellido || '-'}</span>
              </p>
              <p>
                <span><strong>Documento:</strong> {resultado.dni}</span>
                <span><strong>Plan:</strong> {resultado.plan || '-'}</span>
              </p>
            </div>
          </div>

          <p className="ingreso-mensaje">{resultado.mensajeEstado}</p>

          <p className="ingreso-contador">Esta ventana se cierra en: {segundosRestantes}s</p>
        </div>
      )}
    </div>
  )
}

export default Ingreso