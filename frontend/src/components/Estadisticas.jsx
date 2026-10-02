import { useEffect, useState } from 'react'
import {
  obtenerIngresosPorMes,
  obtenerAsistenciasPorMes,
  obtenerTopAsistidores,
  obtenerClientesActivos,
} from '../api/estadisticas'
import './Estadisticas.css'

const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatearMes(mesIso) {
  const [anio, mes] = mesIso.split('-')
  return `${NOMBRES_MES[Number(mes) - 1]} ${anio}`
}

function formatearMoneda(valor) {
  return `$${Number(valor).toLocaleString('es-AR')}`
}

function formatearPeriodo(meses) {
  return meses === 1 ? 'este mes' : `${meses} meses`
}

function GraficoBarras({ datos, obtenerValor, formatearValor, colorClase }) {
  const maximo = Math.max(...datos.map(obtenerValor), 1)

  return (
    <div className="grafico-barras">
      {datos.map((item) => {
        const valor = obtenerValor(item)
        const alturaPorc = Math.max((valor / maximo) * 100, valor > 0 ? 4 : 0)
        return (
          <div className="grafico-columna" key={item.mes}>
            <span className="grafico-valor">{formatearValor(valor)}</span>
            <div className="grafico-barra-track">
              <div className={`grafico-barra ${colorClase}`} style={{ height: `${alturaPorc}%` }} />
            </div>
            <span className="grafico-etiqueta">{formatearMes(item.mes)}</span>
          </div>
        )
      })}
    </div>
  )
}

function Estadisticas() {
  const [meses, setMeses] = useState(1)
  const [ingresos, setIngresos] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [topAsistidores, setTopAsistidores] = useState([])
  const [clientesActivos, setClientesActivos] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false

    async function cargarDatos() {
      setCargando(true)
      setError('')
      try {
        const [ingresosData, asistenciasData, topData, clientesData] = await Promise.all([
          obtenerIngresosPorMes(meses),
          obtenerAsistenciasPorMes(meses),
          obtenerTopAsistidores(meses, 10),
          obtenerClientesActivos(meses),
        ])
        if (cancelado) return
        setIngresos(ingresosData)
        setAsistencias(asistenciasData)
        setTopAsistidores(topData)
        setClientesActivos(clientesData.total)
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarDatos()
    return () => { cancelado = true }
  }, [meses])

  const totalIngresos = ingresos.reduce((suma, item) => suma + Number(item.total), 0)
  const totalAsistencias = asistencias.reduce((suma, item) => suma + Number(item.total), 0)

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Estadisticas</h1>
          <p>Ingresos, asistencias y ranking de socios</p>
        </div>
        <select
          className="estadisticas-selector"
          value={meses}
          onChange={(evento) => setMeses(Number(evento.target.value))}
        >
          <option value={1}>Este mes</option>
          <option value={3}>Ultimos 3 meses</option>
          <option value={6}>Ultimos 6 meses</option>
          <option value={12}>Ultimos 12 meses</option>
          <option value={24}>Ultimos 24 meses</option>
        </select>
      </header>

      {error && <p className="panel-alerta">{error}</p>}

      {cargando ? (
        <p className="panel-cargando">Cargando estadisticas...</p>
      ) : (
        <>
          <section className="stats">
            <article>
              <span>Plata cobrada ({formatearPeriodo(meses)})</span>
              <strong>{formatearMoneda(totalIngresos)}</strong>
            </article>
            <article>
              <span>Asistencias ({formatearPeriodo(meses)})</span>
              <strong>{totalAsistencias}</strong>
            </article>
            <article>
              <span>Clientes distintos que asistieron ({formatearPeriodo(meses)})</span>
              <strong>{clientesActivos}</strong>
            </article>
          </section>

          <section className="work-area">
            <div className="panel">
              <h2>Plata ganada por mes</h2>
              {ingresos.length === 0 ? (
                <p className="panel-vacio">No hay pagos registrados en este periodo.</p>
              ) : (
                <GraficoBarras
                  datos={ingresos}
                  obtenerValor={(item) => Number(item.total)}
                  formatearValor={formatearMoneda}
                  colorClase="grafico-barra-verde"
                />
              )}
            </div>

            <div className="panel">
              <h2>Asistencias por mes</h2>
              {asistencias.length === 0 ? (
                <p className="panel-vacio">No hay asistencias registradas en este periodo.</p>
              ) : (
                <GraficoBarras
                  datos={asistencias}
                  obtenerValor={(item) => Number(item.total)}
                  formatearValor={(valor) => String(valor)}
                  colorClase="grafico-barra-azul"
                />
              )}
            </div>
          </section>

          <section className="work-area">
            <div className="panel panel-ancho">
              <h2>Top asistidores</h2>
              {topAsistidores.length === 0 ? (
                <p className="panel-vacio">No hay asistencias registradas en este periodo.</p>
              ) : (
                <div className="tabla-scroll">
                  <table className="tabla-panel">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Cliente</th>
                        <th>Asistencias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topAsistidores.map((item, indice) => (
                        <tr key={item.clienteId}>
                          <td>{indice + 1}</td>
                          <td>{item.nombre} {item.apellido}</td>
                          <td>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  )
}

export default Estadisticas