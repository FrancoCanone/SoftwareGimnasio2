import { useEffect, useRef, useState } from 'react'
import { listarClientes, obtenerDetalleCliente, eliminarCliente } from '../api/clientes'
import { importarRespaldo } from '../api/respaldo'
import ClienteForm from './ClienteForm'
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

function ClientesLista() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [textoBusqueda, setTextoBusqueda] = useState('')

  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)

  const inputArchivoRef = useRef(null)
  const [importando, setImportando] = useState(false)

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
      (archivo)
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

  async function manejarMigracion() {
    const confirmado = window.confirm(
      'Esto va a leer la base vieja (base_de_datos_vieja) y migrar lo que falte. ¿Continuar?'
    )
    if (!confirmado) return

    setImportando(true)
    setError('')
    try {
      const resumen = await migrarBaseVieja()
      window.alert(
        `Migración completa:\n` +
        `${resumen.clientesNuevos} clientes\n` +
        `${resumen.planesNuevos} planes\n` +
        `${resumen.pagosNuevos} pagos\n` +
        `${resumen.asistenciasNuevas} asistencias`
      )
      await cargarClientes()
    } catch (err) {
      setError(err.message)
    } finally {
      setImportando(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    try {
      setCargando(true)
      const lista = await listarClientes()
      setClientes(lista)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
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

  const clientesFiltrados = palabras.length === 0
    ? clientes
    : clientes.filter((c) => {
        const nombreCompleto = `${c.nombre} ${c.apellido}`.toLowerCase()
        return palabras.every((palabra) =>
          nombreCompleto.includes(palabra) || c.dni.includes(palabra)
        )
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
                  
                    <td className="planes-acciones">
                      <button onClick={() => verDetalle(cliente.id)} className="planes-link">Ver</button>
                      <button onClick={() => editarCliente(cliente)} className="planes-link">Editar</button>
                      <button onClick={() => manejarEliminar(cliente)} className="planes-link planes-link-borrar">Eliminar</button>
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
                  <h2>{detalle.cliente.nombre} {detalle.cliente.apellido}</h2>
                  <button onClick={cerrarDetalle} className="clientes-lista-cerrar">✕</button>
                </div>

                <div className="clientes-lista-datos">
                  <div><span>DNI</span><strong>{detalle.cliente.dni}</strong></div>
                  <div><span>Celular</span><strong>{detalle.cliente.celular}</strong></div>
                  <div><span>Edad</span><strong>{calcularEdad(detalle.cliente.fechaNacimiento)}</strong></div>
                  <div><span>Direccion</span><strong>{detalle.cliente.direccion || '-'}</strong></div>
                  <div><span>Ocupacion</span><strong>{detalle.cliente.ocupacion || '-'}</strong></div>
                  <div><span>Actividad previa</span><strong>{detalle.cliente.actividadPrevia || '-'}</strong></div>
                  <div><span>Peso</span><strong>{detalle.cliente.peso ? `${detalle.cliente.peso} kg` : '-'}</strong></div>
                  <div><span>Altura</span><strong>{detalle.cliente.altura ? `${detalle.cliente.altura} m` : '-'}</strong></div>
                  <div><span>Fecha ingreso</span><strong>{formatearFecha(detalle.cliente.fechaIngreso)}</strong></div>
                  <div><span>Visitas totales</span><strong>{detalle.visitasTotales}</strong></div>
                </div>

                {detalle.cliente.observaciones && (
                  <p className="clientes-lista-observaciones">
                    <span>Observaciones: </span>{detalle.cliente.observaciones}
                  </p>
                )}

                <h3>Historial de pagos</h3>
                {detalle.pagos.length === 0 ? (
                  <p className="panel-vacio">Este cliente todavia no tiene pagos registrados.</p>
                ) : (
                  <table className="tabla-panel">
                    <thead>
                      <tr>
                        <th>Fecha pago</th>
                        <th>Vence</th>
                        <th>Plan</th>
                        <th>Monto</th>
                        <th>Metodo</th>
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
              <button onClick={cerrarEdicion} className="clientes-lista-cerrar">✕</button>
            </div>
            <ClienteForm
              key={clienteEditando.id}
              clienteEditar={clienteEditando}
              onGuardado={manejarGuardadoEdicion}
            />
          </div>
        </div>
      )}

    </div>

    
  )
}

export default ClientesLista