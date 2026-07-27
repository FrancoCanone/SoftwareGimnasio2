import { useEffect, useState } from 'react'
import { listarPlanes, crearPlan, actualizarPlan, eliminarPlan } from '../api/planes'
import { confirmar } from '../lib/confirmar'
import './Planes.css'

const VALORES_INICIALES = {
  nombre: '',
  precio: '',
  duracionDias: '',
  descripcion: '',
  activo: true,
}

function Planes() {
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const [valores, setValores] = useState(VALORES_INICIALES)
  const [editandoId, setEditandoId] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarPlanes()
  }, [])

  async function cargarPlanes() {
    try {
      setCargando(true)
      const lista = await listarPlanes()
      setPlanes(lista)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  function actualizarCampo(campo, valor) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  function empezarEdicion(plan) {
    setEditandoId(plan.id)
    setValores({
      nombre: plan.nombre,
      precio: plan.precio,
      duracionDias: plan.duracionDias,
      descripcion: plan.descripcion || '',
      activo: plan.activo,
    })
    setMensajeExito('')
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setValores(VALORES_INICIALES)
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError('')
    setMensajeExito('')
    setGuardando(true)

    
    try {
      const precio = Number(valores.precio)
      const duracionDias = Number(valores.duracionDias)

      if (precio <= 0) {
        setError('El precio debe ser mayor a 0.')
        setGuardando(false)
        return
      }

      if (duracionDias <= 0) {
        setError('La duracion debe ser mayor a 0 dias.')
        setGuardando(false)
        return
      }

      const datosParaEnviar = {
        ...valores,
        precio,
        duracionDias,
      }

      if (editandoId) {
        await actualizarPlan(editandoId, datosParaEnviar)
        setMensajeExito('Plan actualizado correctamente.')
      } else {
        await crearPlan(datosParaEnviar)
        setMensajeExito('Plan creado correctamente.')
      }

      setValores(VALORES_INICIALES)
      setEditandoId(null)
      await cargarPlanes()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function manejarEliminar(plan) {
    const confirmado = await confirmar(`¿Eliminar el plan "${plan.nombre}"?`, { textoConfirmar: 'Eliminar' })
    if (!confirmado) return

    try {
      await eliminarPlan(plan.id)
      await cargarPlanes()
      if (editandoId === plan.id) {
        cancelarEdicion()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="planes">
      <header className="topbar">
        <div>
          <h1>Planes</h1>
          <p>Gestion de membresias del gimnasio</p>
        </div>
      </header>

      {error && <p className="planes-alerta">{error}</p>}
      {mensajeExito && <p className="planes-exito">{mensajeExito}</p>}

      <div className="planes-layout">
        <form className="planes-form" onSubmit={manejarEnvio}>
          <h2>{editandoId ? 'Editar plan' : 'Nuevo plan'}</h2>

            <label className="planes-campo">
                <span>Nombre *</span>
                <input
                type="text"
                value={valores.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                required
                />
            </label>

            <label className="planes-campo">
                <span>Precio *</span>
                <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valores.precio}
                    onChange={(e) => actualizarCampo('precio', e.target.value)}
                    required
                />
            </label>  

            <label className="planes-campo">
                <span>Duracion (dias) *</span>
                <input
                    type="number"
                    min="1"
                    value={valores.duracionDias}
                    onChange={(e) => actualizarCampo('duracionDias', e.target.value)}
                    required
                />
            </label>

            <label className="planes-campo">
                <span>Descripcion</span>
                <textarea
                value={valores.descripcion}
                onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                rows={2}
                />
            </label>

            <label className="planes-checkbox">
                <input
                type="checkbox"
                checked={valores.activo}
                onChange={(e) => actualizarCampo('activo', e.target.checked)}
                />
                <span>Plan activo</span>
            </label>

            <div className="planes-form-botones">
                <button type="submit" disabled={guardando} className="planes-boton">
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear plan'}
                </button>
                {editandoId && (
                <button type="button" onClick={cancelarEdicion} className="planes-boton-secundario">
                    Cancelar
                </button>
                )}
            </div>
        </form>

        <div className="planes-tabla-contenedor">
          <h2>Planes existentes</h2>
          {cargando ? (
            <p className="panel-cargando">Cargando planes...</p>
          ) : planes.length === 0 ? (
            <p className="panel-vacio">Todavia no hay planes cargados.</p>
          ) : (
            <table className="tabla-panel">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Duracion</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.nombre}</td>
                    <td>${plan.precio}</td>
                    <td>{plan.duracionDias} dias</td>
                    <td>
                      <span className={plan.activo ? 'estado-ok' : 'estado-error'}>
                        {plan.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="planes-acciones">
                      <button onClick={() => empezarEdicion(plan)} className="planes-link">Editar</button>
                      <button onClick={() => manejarEliminar(plan)} className="planes-link planes-link-borrar">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default Planes