import { useEffect, useState } from 'react'
import { buscarClientes, buscarClientePorDni } from '../api/clientes'
import { listarPlanesActivos } from '../api/planes'
import { listarPagos, crearPago, obtenerUltimoPagoCliente } from '../api/pagos'
import CampoFecha from './CampoFecha'
import './Pagos.css'

const ES_SOLO_NUMEROS = /^\d+$/

function sumarDias(fechaIso, dias) {
  if (!fechaIso || !dias) return null
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  fecha.setDate(fecha.getDate() + Number(dias))
  const anioF = fecha.getFullYear()
  const mesF = String(fecha.getMonth() + 1).padStart(2, '0')
  const diaF = String(fecha.getDate()).padStart(2, '0')
  return `${diaF}/${mesF}/${anioF}`
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '-'
  const [anio, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}/${anio}`
}

function calcularFechaSugerida(diaReferencia) {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth()
  const ultimoDiaDelMes = new Date(anio, mes + 1, 0).getDate()
  const dia = Math.min(diaReferencia, ultimoDiaDelMes)
  const fecha = new Date(anio, mes, dia)
  const anioF = fecha.getFullYear()
  const mesF = String(fecha.getMonth() + 1).padStart(2, '0')
  const diaF = String(fecha.getDate()).padStart(2, '0')
  return `${anioF}-${mesF}-${diaF}`
}

function Pagos() {
  const [planes, setPlanes] = useState([])
  const [pagos, setPagos] = useState([])
  const [cargandoPagos, setCargandoPagos] = useState(true)

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [sugerenciaFecha, setSugerenciaFecha] = useState(false)

  const [planId, setPlanId] = useState('')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().slice(0, 10))
  const [observaciones, setObservaciones] = useState('')

  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    listarPlanesActivos().then(setPlanes).catch((err) => setError(err.message))
    cargarPagos()
  }, [])

  async function cargarPagos() {
    try {
      setCargandoPagos(true)
      const lista = await listarPagos()
      lista.sort((a, b) => (a.fechaPago < b.fechaPago ? 1 : -1))
      setPagos(lista)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoPagos(false)
    }
  }

  async function manejarBusqueda(evento) {
    evento.preventDefault()
    setError('')
    const texto = textoBusqueda.trim()
    if (!texto) return

    setBuscando(true)
    try {
      if (ES_SOLO_NUMEROS.test(texto)) {
        const cliente = await buscarClientePorDni(texto)
        setResultadosBusqueda(cliente ? [cliente] : [])
      } else {
        const lista = await buscarClientes(texto)
        setResultadosBusqueda(lista)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBuscando(false)
    }
  }

  async function seleccionarCliente(cliente) {
    setClienteSeleccionado(cliente)
    setResultadosBusqueda([])
    setTextoBusqueda('')
    setSugerenciaFecha(false)

    try {
      const ultimoPago = await obtenerUltimoPagoCliente(cliente.id)
      if (ultimoPago) {
        const diaReferencia = Number(ultimoPago.fechaPago.split('-')[2])
        setFechaPago(calcularFechaSugerida(diaReferencia))
        setSugerenciaFecha(true)
      }
    } catch {
      // si falla la consulta, no pasa nada: se queda con la fecha de hoy por defecto
    }
  }

  function cambiarCliente() {
    setClienteSeleccionado(null)
  }

  function manejarCambioPlan(idSeleccionado) {
    setPlanId(idSeleccionado)
    const plan = planes.find((p) => String(p.id) === idSeleccionado)
    if (plan) {
      setMonto(String(plan.precio))
    }
  }

  const planSeleccionado = planes.find((p) => String(p.id) === planId)
  const vencimientoEstimado = planSeleccionado
    ? sumarDias(fechaPago, planSeleccionado.duracionDias)
    : null

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError('')
    setMensajeExito('')

    if (!clienteSeleccionado) {
      setError('Buscá y seleccioná un cliente antes de continuar.')
      return
    }
    if (!planId) {
      setError('Seleccioná un plan.')
      return
    }
    if (!monto || Number(monto) <= 0) {
      setError('El monto debe ser mayor a 0.')
      return
    }

    setGuardando(true)
    try {
      await crearPago({
        clienteId: clienteSeleccionado.id,
        planId: Number(planId),
        monto: Number(monto),
        metodoPago,
        fechaPago,
        observaciones,
      })

      setMensajeExito('Pago registrado correctamente.')
      setClienteSeleccionado(null)
      setPlanId('')
      setMonto('')
      setObservaciones('')
      setFechaPago(new Date().toISOString().slice(0, 10))
      await cargarPagos()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pagos">
      <header className="topbar">
        <div>
          <h1>Pagos</h1>
          <p>Registro de cuotas del gimnasio</p>
        </div>
      </header>

      {error && <p className="planes-alerta">{error}</p>}
      {mensajeExito && <p className="planes-exito">{mensajeExito}</p>}

      <div className="planes-layout">
        <form className="planes-form" onSubmit={manejarEnvio}>
          <h2>Nuevo pago</h2>

          {!clienteSeleccionado ? (
            <>
              <label className="planes-campo">
                <span>Buscar cliente (DNI o nombre)</span>
                <div className="pagos-busqueda">
                  <input
                    type="text"
                    value={textoBusqueda}
                    onChange={(e) => setTextoBusqueda(e.target.value)}
                    placeholder="Ej: 40123456 o Franco"
                  />
                  <button type="button" onClick={manejarBusqueda} disabled={buscando} className="planes-boton-secundario">
                    {buscando ? '...' : 'Buscar'}
                  </button>
                </div>
              </label>

              {resultadosBusqueda.length > 0 && (
                <ul className="pagos-resultados">
                  {resultadosBusqueda.map((cliente) => (
                    <li key={cliente.id}>
                      <button type="button" onClick={() => seleccionarCliente(cliente)}>
                        {cliente.nombre} {cliente.apellido} — DNI {cliente.dni}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="pagos-cliente-elegido">
              <div>
                <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
                <span>DNI {clienteSeleccionado.dni}</span>
              </div>
              <button type="button" onClick={cambiarCliente} className="planes-link">Cambiar</button>
            </div>
          )}

          <label className="planes-campo">
            <span>Plan *</span>
            <select value={planId} onChange={(e) => manejarCambioPlan(e.target.value)} required>
              <option value="">Seleccionar plan...</option>
              {planes.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} (${plan.precio})
                </option>
              ))}
            </select>
          </label>

          <label className="planes-campo">
            <span>Monto *</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </label>

          <label className="planes-campo">
            <span>Metodo de pago</span>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>

          <CampoFecha label="Fecha de pago" value={fechaPago} onChange={(v) => { setFechaPago(v); setSugerenciaFecha(false) }} required />
          {sugerenciaFecha && (
            <p className="pagos-sugerencia">Sugerida según su último pago (día {new Date(fechaPago + 'T00:00').getDate()}). Podés cambiarla si hace falta.</p>
          )}

          {vencimientoEstimado && (
            <p className="pagos-vencimiento">Vence el <strong>{vencimientoEstimado}</strong></p>
          )}

          <label className="planes-campo">
            <span>Observaciones</span>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} />
          </label>

          <button type="submit" disabled={guardando} className="planes-boton">
            {guardando ? 'Guardando...' : 'Registrar pago'}
          </button>
        </form>

        <div className="planes-tabla-contenedor">
          <h2>Pagos registrados</h2>
          {cargandoPagos ? (
            <p className="panel-cargando">Cargando pagos...</p>
          ) : pagos.length === 0 ? (
            <p className="panel-vacio">Todavia no hay pagos registrados.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla-panel">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Plan</th>
                    <th>Monto</th>
                    <th>Pago</th>
                    <th>Vence</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td>{pago.cliente.nombre} {pago.cliente.apellido}</td>
                      <td>{pago.plan.nombre}</td>
                      <td>${pago.monto}</td>
                      <td>{formatearFecha(pago.fechaPago)}</td>
                      <td>{formatearFecha(pago.fechaVencimiento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pagos