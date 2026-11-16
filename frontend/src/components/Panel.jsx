import { useEffect, useState } from 'react'
import { listarAsistenciasHoy } from '../api/asistencias'
import { listarCuotasVencidas, listarEstadosDeClientes } from '../api/pagos'
import Icono from './Icono'
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
  const [clientesActivos, setClientesActivos] = useState(null)
  const [asistenciasHoy, setAsistenciasHoy] = useState([])
  const [cuotasVencidas, setCuotasVencidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    async function cargarDatos(esPrimeraVez) {
      try {
        const [estados, asistencias, vencidas] = await Promise.all([
          listarEstadosDeClientes(),
          listarAsistenciasHoy(),
          listarCuotasVencidas(),
        ])
        const asistenciasOrdenadas = [...asistencias].sort(
          (a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)
        )


        setClientesActivos(estados.filter((e) => e.estado === 'ACTIVO').length)
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

  const clientesQueAsistieron = new Set(asistenciasHoy.map((a) => a.cliente.id)).size
  const ingresosRechazados = asistenciasHoy.filter((a) => a.estado !== 'ACEPTADO').length

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
        <article className="stat-con-icono">
          <div className="stat-icono"><Icono nombre="clientes" size={22} /></div>
          <div>
            <span>Clientes activos</span>
            <strong>{clientesActivos ?? '-'}</strong>
          </div>
        </article>
        <article className="stat-con-icono stat-azul">
          <div className="stat-icono"><Icono nombre="check" size={22} /></div>
          <div>
            <span>Asistieron hoy</span>
            <strong>{clientesQueAsistieron}</strong>
          </div>
        </article>
        <article className="stat-con-icono stat-rojo">
          <div className="stat-icono"><Icono nombre="rechazo" size={22} /></div>
          <div>
            <span>Ingresos rechazados hoy</span>
            <strong>{ingresosRechazados}</strong>
          </div>
        </article>
        <article className="stat-con-icono stat-ambar">
          <div className="stat-icono"><Icono nombre="alerta" size={22} /></div>
          <div>
            <span>Cuotas vencidas</span>
            <strong>{cuotasVencidas.length}</strong>
          </div>
        </article>
      </section>

      <section className="work-area">
        <div className="panel">
          <h2>Asistencias de hoy <span className="panel-contador">({clientesQueAsistieron})</span></h2>
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
                  <th>Asistencias totales</th>
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
                    <td className="panel-detalle">{asistencia.visitasTotales}</td>
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
