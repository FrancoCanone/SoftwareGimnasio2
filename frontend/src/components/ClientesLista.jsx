import { useEffect, useRef, useState } from 'react'
import { listarClientes, obtenerDetalleCliente, eliminarCliente } from '../api/clientes'
import { importarRespaldo } from '../api/respaldo'
import { actualizarPago, eliminarPago, listarEstadosDeClientes } from '../api/pagos'
import { listarPlanesActivos } from '../api/planes'
import ClienteForm from './ClienteForm'
import Icono from './Icono'
import CampoFecha from './CampoFecha'
import { confirmar } from '../lib/confirmar'
import { notificarExito } from '../lib/toasts'
import './ClientesLista.css'

function calcularEdad(fechaNacimientoIso) {
  if (!fechaNacimientoIso) return '-'
  const [año, mes, dia] = fechaNacimientoIso.split('-').map(Number)
  const nacimiento = new Date(año, mes - 1, dia)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()

  const noCumplioAunEsteaño =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())

  if (noCumplioAunEsteaño) edad--
  return edad
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '-'
  const [año, mes, dia] = fechaIso.split('-')
  return `${dia}/${mes}/${año}`
}

const FILTROS_VACIOS = {
  estado: '',
  plan: '',
  edadDesde: '',
  edadHasta: '',
  ingresoDesde: '',
  ingresoHasta: '',
  orden: 'apellido',
}

const ETIQUETAS_ESTADO = {
  ACTIVO: 'Activo',
  VENCIDO: 'Vencido',
  SIN_PAGO: 'Sin pago',
}

function compararTexto(a, b) {
  return (a || '').localeCompare(b || '', 'es', { sensitivity: 'base' })
}

function ClientesLista() {

  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [estadosPorCliente, setEstadosPorCliente] = useState({})
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)

  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)

  const [planesActivos, setPlanesActivos] = useState([])
  const [pagoEditando, setPagoEditando] = useState(null)
  const [formPago, setFormPago] = useState({ planId: '', monto: '', metodoPago: '', fechaPago: '', observaciones: '' })
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  const inputArchivoRef = useRef(null)
  const [importando, setImportando] = useState(false)

  useEffect(() => {
    cargarClientes()
  }, [])

  function abrirSelectorArchivo() {
    inputArchivoRef.current?.click()
  }

  async function manejarArchivoSeleccionado(evento) {
    const archivo = evento.target.files[0]
    evento.target.value = ''
    if (!archivo) return

    setImportando(true)
    setError('')

    try {
      const resumen = await importarRespaldo(archivo)

      notificarExito(
        `Importación completa:\n` +
          `${resumen.clientesNuevos} clientes nuevos\n` +
          `${resumen.planesNuevos} planes nuevos\n` +
          `${resumen.pagosNuevos} pagos nuevos\n` +
          `${resumen.asistenciasNuevas} asistencias nuevas\n\n` +
          `(los que ya existían se saltearon, no se duplicó nada)`,
        7000
      )

      await cargarClientes()
    } catch (err) {
      setError(err.message)
    } finally {
      setImportando(false)
    }
  }

  async function cargarClientes() {
    try {
      setCargando(true)
      const [lista] = await Promise.all([listarClientes(), cargarEstados()])
      setClientes(lista)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  async function cargarEstados() {
    try {
      const estados = await listarEstadosDeClientes()
      const mapa = {}
      for (const estado of estados) mapa[estado.clienteId] = estado
      setEstadosPorCliente(mapa)
    } catch (err) {
      setError(err.message)
    }
  }

  function cambiarFiltro(campo, valor) {
    setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS)
  }

  async function verDetalle(id) {
    setCargandoDetalle(true)
    setError('')

    try {
      const datos = await obtenerDetalleCliente(id)
      setDetalle(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoDetalle(false)
    }
  }

    function cerrarDetalle() {
    setDetalle(null)
  }

  async function recargarDetalle() {
    if (!detalle) return
    const datos = await obtenerDetalleCliente(detalle.cliente.id)
    setDetalle(datos)
  }

  async function abrirEdicionPago(pago) {
    setErrorPago('')
    setPagoEditando(pago)
    setFormPago({
      planId: pago.plan.id,
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      fechaPago: pago.fechaPago,
      observaciones: pago.observaciones || '',
    })

    if (planesActivos.length === 0) {
      try {
        const lista = await listarPlanesActivos()
        setPlanesActivos(lista)
      } catch (err) {
        setErrorPago(err.message)
      }
    }
  }

  function cerrarEdicionPago() {
    setPagoEditando(null)
  }

  async function guardarEdicionPago(evento) {
    evento.preventDefault()
    setGuardandoPago(true)
    setErrorPago('')

    try {
      await actualizarPago(pagoEditando.id, {
        clienteId: detalle.cliente.id,
        planId: Number(formPago.planId),
        monto: Number(formPago.monto),
        metodoPago: formPago.metodoPago,
        fechaPago: formPago.fechaPago,
        observaciones: formPago.observaciones,
      })
      notificarExito('Pago actualizado')
      setPagoEditando(null)
      await Promise.all([recargarDetalle(), cargarEstados()])
    } catch (err) {
      setErrorPago(err.message)
    } finally {
      setGuardandoPago(false)
    }
  }

  async function manejarEliminarPago(pago) {
    const confirmado = await confirmar(
      `¿Eliminar este pago de $${pago.monto} del ${formatearFecha(pago.fechaPago)}?`,
      { textoConfirmar: 'Eliminar' }
    )
    if (!confirmado) return

    try {
      await eliminarPago(pago.id)
      notificarExito('Pago eliminado')
      await Promise.all([recargarDetalle(), cargarEstados()])
    } catch (err) {
      setError(err.message)
    }
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente)
  }

  function cerrarEdicion() {
    setClienteEditando(null)
  }

  async function manejarGuardadoEdicion() {
    setClienteEditando(null)
    await cargarClientes()
  }

  async function manejarEliminar(cliente) {
    const confirmado = await confirmar(
      `¿Eliminar a ${cliente.nombre} ${cliente.apellido}? Esto también borra sus pagos y asistencias.`,
      { textoConfirmar: 'Eliminar' }
    )

    if (!confirmado) return

    try {
      await eliminarCliente(cliente.id)
      await cargarClientes()

      if (detalle && detalle.cliente.id === cliente.id) {
        setDetalle(null)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const palabras = textoBusqueda.trim().toLowerCase().split(/\s+/).filter(Boolean)

  function estadoDe(cliente) {
    return estadosPorCliente[cliente.id]?.estado || 'SIN_PAGO'
  }

  const planesDisponibles = [
    ...new Set(Object.values(estadosPorCliente).map((e) => e.planNombre).filter(Boolean)),
  ].sort(compararTexto)

  const cantidadFiltrosActivos = Object.keys(FILTROS_VACIOS).filter(
    (campo) => campo !== 'orden' && filtros[campo] !== ''
  ).length

  const edadDesde = filtros.edadDesde === '' ? null : Number(filtros.edadDesde)
  const edadHasta = filtros.edadHasta === '' ? null : Number(filtros.edadHasta)

  const clientesFiltrados = clientes
    .filter((c) => {
      if (palabras.length > 0) {
        const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase()
        const coincide = palabras.every(
          (palabra) => nombreCompleto.includes(palabra) || (c.dni || '').includes(palabra)
        )
        if (!coincide) return false
      }

      if (filtros.estado && estadoDe(c) !== filtros.estado) return false

      if (filtros.plan && estadosPorCliente[c.id]?.planNombre !== filtros.plan) return false

      if (edadDesde !== null || edadHasta !== null) {
        const edad = calcularEdad(c.fechaNacimiento)
        if (typeof edad !== 'number') return false
        if (edadDesde !== null && edad < edadDesde) return false
        if (edadHasta !== null && edad > edadHasta) return false
      }

      // las fechas ISO (aaaa-mm-dd) se pueden comparar como texto
      if (filtros.ingresoDesde && (!c.fechaIngreso || c.fechaIngreso < filtros.ingresoDesde)) return false
      if (filtros.ingresoHasta && (!c.fechaIngreso || c.fechaIngreso > filtros.ingresoHasta)) return false

      return true
    })
    .sort((a, b) => {
      switch (filtros.orden) {
        case 'nombre':
          return compararTexto(a.nombre, b.nombre) || compararTexto(a.apellido, b.apellido)
        case 'ingresoReciente':
          return compararTexto(b.fechaIngreso, a.fechaIngreso)
        case 'ingresoAntiguo':
          return compararTexto(a.fechaIngreso, b.fechaIngreso)
        case 'vencimiento': {
          const va = estadosPorCliente[a.id]?.fechaVencimiento || '9999-12-31'
          const vb = estadosPorCliente[b.id]?.fechaVencimiento || '9999-12-31'
          return compararTexto(va, vb)
        }
        default:
          return compararTexto(a.apellido, b.apellido) || compararTexto(a.nombre, b.nombre)
      }
    })

  return (
    <div className="clientes-lista">
      <header className="topbar">
        <div>
          <h1>Base de clientes</h1>
          <p>Buscar y ver el detalle completo de cada cliente</p>
        </div>
      </header>

      {error && <p className="planes-alerta">{error}</p>}

      <div className="planes-tabla-contenedor">
        <div className="clientes-lista-toolbar">
          <input
            type="text"
            className="clientes-lista-buscador"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
          />

          <button
            type="button"
            className={`planes-boton-secundario clientes-lista-boton-filtros${mostrarFiltros ? ' activo' : ''}`}
            onClick={() => setMostrarFiltros((v) => !v)}
            aria-expanded={mostrarFiltros}
          >
            <Icono nombre="filtro" size={16} />
            Filtros
            {cantidadFiltrosActivos > 0 && (
              <span className="clientes-lista-filtros-contador">{cantidadFiltrosActivos}</span>
            )}
          </button>

          <a href="/api/respaldo/descargar" className="planes-boton-secundario">
            Descargar BDD completa
          </a>

          <button
            type="button"
            className="planes-boton-secundario"
            onClick={abrirSelectorArchivo}
            disabled={importando}
          >
            {importando ? 'Importando...' : 'Cargar base completa'}
          </button>

          <input
            type="file"
            accept=".zip"
            ref={inputArchivoRef}
            onChange={manejarArchivoSeleccionado}
            style={{ display: 'none' }}
          />
        </div>

        {mostrarFiltros && (
          <div className="clientes-lista-filtros">
            <label className="planes-campo">
              <span>Estado de cuota</span>
              <select value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
                <option value="">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="VENCIDO">Vencidos</option>
                <option value="SIN_PAGO">Sin pagos</option>
              </select>
            </label>

            <label className="planes-campo">
              <span>Plan</span>
              <select value={filtros.plan} onChange={(e) => cambiarFiltro('plan', e.target.value)}>
                <option value="">Todos</option>
                {planesDisponibles.map((plan) => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </label>

            <div className="planes-campo">
              <span>Edad</span>
              <div className="clientes-lista-rango">
                <input
                  type="number"
                  min="0"
                  placeholder="Desde"
                  value={filtros.edadDesde}
                  onChange={(e) => cambiarFiltro('edadDesde', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Hasta"
                  value={filtros.edadHasta}
                  onChange={(e) => cambiarFiltro('edadHasta', e.target.value)}
                />
              </div>
            </div>

            <CampoFecha
              label="Ingresó desde"
              value={filtros.ingresoDesde}
              onChange={(valor) => cambiarFiltro('ingresoDesde', valor)}
            />

            <CampoFecha
              label="Ingresó hasta"
              value={filtros.ingresoHasta}
              onChange={(valor) => cambiarFiltro('ingresoHasta', valor)}
            />

            <label className="planes-campo">
              <span>Ordenar por</span>
              <select value={filtros.orden} onChange={(e) => cambiarFiltro('orden', e.target.value)}>
                <option value="apellido">Apellido (A-Z)</option>
                <option value="nombre">Nombre (A-Z)</option>
                <option value="ingresoReciente">Ingreso más reciente</option>
                <option value="ingresoAntiguo">Ingreso más antiguo</option>
                <option value="vencimiento">Vencimiento más próximo</option>
              </select>
            </label>

            <div className="clientes-lista-filtros-pie">
              <span>
                Mostrando {clientesFiltrados.length} de {clientes.length} clientes
              </span>
              <button
                type="button"
                className="planes-link"
                onClick={limpiarFiltros}
                disabled={cantidadFiltrosActivos === 0 && filtros.orden === FILTROS_VACIOS.orden}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="panel-cargando">Cargando clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="panel-vacio">No se encontraron clientes.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla-panel">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>DNI</th>
                  <th>Celular</th>
                  <th>Edad</th>
                  <th>Fecha ingreso</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.apellido}</td>
                    <td>{cliente.dni}</td>
                    <td>{cliente.celular}</td>
                    <td>{calcularEdad(cliente.fechaNacimiento)}</td>
                    <td>{formatearFecha(cliente.fechaIngreso)}</td>
                    <td>
                      <span className={`clientes-lista-estado estado-${estadoDe(cliente).toLowerCase()}`}>
                        {ETIQUETAS_ESTADO[estadoDe(cliente)]}
                      </span>
                    </td>

                    <td className="planes-acciones">
                      <button onClick={() => verDetalle(cliente.id)} className="planes-link">
                        Ver
                      </button>
                      <button onClick={() => editarCliente(cliente)} className="planes-link">
                        Editar
                      </button>
                      <button
                        onClick={() => manejarEliminar(cliente)}
                        className="planes-link planes-link-borrar"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(detalle || cargandoDetalle) && (
        <div className="clientes-lista-overlay" onClick={cerrarDetalle}>
          <div className="clientes-lista-modal" onClick={(e) => e.stopPropagation()}>
            {cargandoDetalle && !detalle ? (
              <p className="panel-cargando">Cargando detalle...</p>
            ) : (
              <>
                <div className="clientes-lista-modal-header">
                  <h2>
                    {detalle.cliente.nombre} {detalle.cliente.apellido}
                  </h2>
                  <button onClick={cerrarDetalle} className="clientes-lista-cerrar">
                    ✕
                  </button>
                </div>

                <div className="clientes-lista-datos">
                  <div>
                    <span>DNI</span>
                    <strong>{detalle.cliente.dni}</strong>
                  </div>
                  <div>
                    <span>Celular</span>
                    <strong>{detalle.cliente.celular}</strong>
                  </div>
                  <div>
                    <span>Edad</span>
                    <strong>{calcularEdad(detalle.cliente.fechaNacimiento)}</strong>
                  </div>
                  <div>
                    <span>Dirección</span>
                    <strong>{detalle.cliente.direccion || '-'}</strong>
                  </div>
                  <div>
                    <span>Ocupación</span>
                    <strong>{detalle.cliente.ocupacion || '-'}</strong>
                  </div>
                  <div>
                    <span>Actividad previa</span>
                    <strong>{detalle.cliente.actividadPrevia || '-'}</strong>
                  </div>
                  <div>
                    <span>Peso</span>
                    <strong>{detalle.cliente.peso ? `${detalle.cliente.peso} kg` : '-'}</strong>
                  </div>
                  <div>
                    <span>Altura</span>
                    <strong>{detalle.cliente.altura ? `${detalle.cliente.altura} m` : '-'}</strong>
                  </div>
                  <div>
                    <span>Fecha ingreso</span>
                    <strong>{formatearFecha(detalle.cliente.fechaIngreso)}</strong>
                  </div>
                  <div>
                    <span>Visitas totales</span>
                    <strong>{detalle.visitasTotales}</strong>
                  </div>
                </div>

                {detalle.cliente.observaciones && (
                  <p className="clientes-lista-observaciones">
                    <span>Observaciones: </span>
                    {detalle.cliente.observaciones}
                  </p>
                )}

                <h3>Historial de pagos</h3>

                                {detalle.pagos.length === 0 ? (
                  <p className="panel-vacio">Este cliente todavía no tiene pagos registrados.</p>
                ) : (
                  <table className="tabla-panel">
                    <thead>
                      <tr>
                        <th>Fecha pago</th>
                        <th>Vence</th>
                        <th>Plan</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {detalle.pagos.map((pago) => (
                        <tr key={pago.id}>
                          <td>{formatearFecha(pago.fechaPago)}</td>
                          <td>{formatearFecha(pago.fechaVencimiento)}</td>
                          <td>{pago.plan.nombre}</td>
                          <td>${pago.monto}</td>
                          <td>{pago.metodoPago}</td>
                          <td className="planes-acciones">
                            <button onClick={() => abrirEdicionPago(pago)} className="planes-link">
                              Editar
                            </button>
                            <button
                              onClick={() => manejarEliminarPago(pago)}
                              className="planes-link planes-link-borrar"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}

            {clienteEditando && (
        <div className="clientes-lista-overlay" onClick={cerrarEdicion}>
          <div className="clientes-lista-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clientes-lista-modal-header">
              <h2>Editar cliente</h2>
              <button onClick={cerrarEdicion} className="clientes-lista-cerrar">
                ✕
              </button>
            </div>

            <ClienteForm
              key={clienteEditando.id}
              clienteEditar={clienteEditando}
              onGuardado={manejarGuardadoEdicion}
            />
          </div>
        </div>
      )}

      {pagoEditando && (
        <div className="clientes-lista-overlay" onClick={cerrarEdicionPago}>
          <div className="clientes-lista-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clientes-lista-modal-header">
              <h2>Editar pago</h2>
              <button onClick={cerrarEdicionPago} className="clientes-lista-cerrar">
                ✕
              </button>
            </div>

            {errorPago && <p className="planes-alerta">{errorPago}</p>}

            <form className="planes-form" onSubmit={guardarEdicionPago}>
              <label className="planes-campo">
                <span>Plan</span>
                <select
                  value={formPago.planId}
                  onChange={(e) => setFormPago({ ...formPago, planId: e.target.value })}
                  required
                >
                  <option value="" disabled>Seleccionar plan...</option>
                  {planesActivos.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} (${plan.precio})
                    </option>
                  ))}
                </select>
              </label>

              <label className="planes-campo">
                <span>Monto</span>
                <input
                  type="number"
                  value={formPago.monto}
                  onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                  required
                />
              </label>

              <label className="planes-campo">
                <span>Método de pago</span>
                <select
                  value={formPago.metodoPago}
                  onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </label>

              <CampoFecha
                label="Fecha de pago"
                value={formPago.fechaPago}
                onChange={(valor) => setFormPago({ ...formPago, fechaPago: valor })}
                required
              />

              <label className="planes-campo">
                <span>Observaciones</span>
                <textarea
                  value={formPago.observaciones}
                  onChange={(e) => setFormPago({ ...formPago, observaciones: e.target.value })}
                />
              </label>

              <button type="submit" className="primary" disabled={guardandoPago}>
                {guardandoPago ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientesLista