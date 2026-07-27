import { useEffect, useState } from 'react'
import { listarClientes } from '../api/clientes'
import { listarAsistenciasHoy } from '../api/asistencias'
import { listarCuotasVencidas } from '../api/pagos'
import './Panel.css'

function formatearHora(fechaHoraIso) {
  const fecha = new Date(fechaHoraIso)
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatearFecha(fechaIso) {
  const [año, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}/${año}`
}

function formatearObservacion(observacion) {
  if (!observacion) return ''
  return observacion.replace(/(\d{4})-(\d{2})-(\d{2})/, (coincidencia, año, mes, dia) => `${dia}/${mes}/${año}`)
}

function Panel() {
  const [totalClientes, setTotalClientes] = useState(null)
  const [asistenciasHoy, setAsistenciasHoy] = useState([])
  const [cuotasVencidas, setCuotasVencidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function cargarDatos(esPrimeraVez) {
      try {
        const [clientes, asistencias, vencidas] = await Promise.all([
          listarClientes(),
          listarAsistenciasHoy(),
          listarCuotasVencidas(),
        ])
        const asistenciasOrdenadas = [...asistencias].sort(
          (a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)
        )

        setTotalClientes(clientes.length)
        setAsistenciasHoy(asistenciasOrdenadas)
        setCuotasVencidas(vencidas)
      } catch (err) {
        setError(err.message)
      } finally {
        if (esPrimeraVez) setCargando(false)
      }
    }

    cargarDatos(true)
    const intervalo = setInterval(() => cargarDatos(false), 5000)

    const canalEventos = new BroadcastChannel('gimnasio-eventos')
    canalEventos.onmessage = (evento) => {
      if (evento.data.tipo === 'asistencia-registrada') {
        cargarDatos(false)
      }
    }

    return () => {
      clearInterval(intervalo)
      canalEventos.close()
    }
  }, [])

  if (cargando) {
    return <p className="panel-cargando">Cargando panel...</p>
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Panel principal</h1>
          <p>Gestion diaria del gimnasio</p>
        </div>
      </header>

      {error && <p className="panel-alerta">{error}</p>}

      <section className="stats">
        <article>
          <span>Clientes</span>
          <strong>{totalClientes}</strong>
        </article>
      </section>

      <section className="work-area">
        <div className="panel">
          <h2>Asistencias de hoy</h2>
          {asistenciasHoy.length === 0 ? (
            <p className="panel-vacio">Todavia no hay asistencias registradas hoy.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla-panel">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {asistenciasHoy.map((asistencia) => (
                    <tr key={asistencia.id}>
                      <td>{asistencia.cliente.nombre} {asistencia.cliente.apellido}</td>
                      <td>{formatearHora(asistencia.fechaHora)}</td>
                      <td>
                        <span className={asistencia.estado === 'ACEPTADO' ? 'estado-ok' : 'estado-error'}>
                          {asistencia.estado}
                        </span>
                      </td>
                      <td className="panel-detalle">{formatearObservacion(asistencia.observacion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Cuotas vencidas</h2>
          {cuotasVencidas.length === 0 ? (
            <p className="panel-vacio">No hay cuotas vencidas.</p>
          ) : (
            <div className="tabla-scroll">
            <table className="tabla-panel">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan</th>
                  <th>Vencio el</th>
                </tr>
              </thead>
              <tbody>
                {cuotasVencidas.map((pago) => (
                  <tr key={pago.id}>
                    <td>{pago.cliente.nombre} {pago.cliente.apellido}</td>
                    <td>{pago.plan.nombre}</td>
                    <td>{formatearFecha(pago.fechaVencimiento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Panel