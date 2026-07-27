import { useState } from 'react'
import { crearCliente, actualizarCliente } from '../api/clientes'
import CampoFecha from './CampoFecha'
import './ClienteForm.css'

const VALORES_INICIALES = {
  nombre: '',
  apellido: '',
  dni: '',
  celular: '',
  direccion: '',
  ocupacion: '',
  actividadPrevia: '',
  observaciones: '',
  peso: '',
  altura: '',
  fechaNacimiento: '',
  fechaIngreso: new Date().toISOString().slice(0, 10),
}

function mapearClienteAValores(cliente) {
  return {
    nombre: cliente.nombre || '',
    apellido: cliente.apellido || '',
    dni: cliente.dni || '',
    celular: cliente.celular || '',
    direccion: cliente.direccion || '',
    ocupacion: cliente.ocupacion || '',
    actividadPrevia: cliente.actividadPrevia || '',
    observaciones: cliente.observaciones || '',
    peso: cliente.peso ?? '',
    altura: cliente.altura ?? '',
    fechaNacimiento: cliente.fechaNacimiento || '',
    fechaIngreso: cliente.fechaIngreso || '',
  }
}

function ClienteForm({ clienteEditar = null, onGuardado = () => {} }) {
  const esEdicion = Boolean(clienteEditar)

  const [valores, setValores] = useState(
    esEdicion ? mapearClienteAValores(clienteEditar) : VALORES_INICIALES
  )
  const [erroresPorCampo, setErroresPorCampo] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')
  const [guardando, setGuardando] = useState(false)

  function actualizarCampo(campo, valor) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }))
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setErrorGeneral('')
    setErroresPorCampo({})
    setMensajeExito('')
    setGuardando(true)

    try {
      const datosParaEnviar = {
        ...valores,
        peso: valores.peso === '' ? null : Number(valores.peso),
        altura: valores.altura === '' ? null : Number(valores.altura),
      }

      if (esEdicion) {
        await actualizarCliente(clienteEditar.id, datosParaEnviar)
        onGuardado()
      } else {
        await crearCliente(datosParaEnviar)
        setMensajeExito('Cliente registrado correctamente.')
        setValores(VALORES_INICIALES)
      }
    } catch (error) {
      if (error.erroresPorCampo) {
        setErroresPorCampo(error.erroresPorCampo)
      } else {
        setErrorGeneral(error.message)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="cliente-form" onSubmit={manejarEnvio}>
      <h2>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h2>
      <p className="cliente-form-leyenda">Los campos marcados con <strong>*</strong> son obligatorios.</p>

      {errorGeneral && <p className="cliente-form-alerta">{errorGeneral}</p>}
      {mensajeExito && <p className="cliente-form-exito">{mensajeExito}</p>}

      <div className="cliente-form-grid">
        <Campo label="Nombre" value={valores.nombre} onChange={(v) => actualizarCampo('nombre', v)} error={erroresPorCampo.nombre} required />
        <Campo label="Apellido" value={valores.apellido} onChange={(v) => actualizarCampo('apellido', v)} error={erroresPorCampo.apellido} required />
        <Campo label="DNI" value={valores.dni} onChange={(v) => actualizarCampo('dni', v)} error={erroresPorCampo.dni} required />
        <Campo label="Celular" value={valores.celular} onChange={(v) => actualizarCampo('celular', v)} error={erroresPorCampo.celular} required />
        <Campo label="Dirección" value={valores.direccion} onChange={(v) => actualizarCampo('direccion', v)} error={erroresPorCampo.direccion} />
        <Campo label="Ocupación" value={valores.ocupacion} onChange={(v) => actualizarCampo('ocupacion', v)} error={erroresPorCampo.ocupacion} />
        <Campo label="Actividad previa" value={valores.actividadPrevia} onChange={(v) => actualizarCampo('actividadPrevia', v)} error={erroresPorCampo.actividadPrevia} />
        <Campo label="Peso (kg)" type="number" value={valores.peso} onChange={(v) => actualizarCampo('peso', v)} error={erroresPorCampo.peso} />
        <Campo label="Altura (m)" type="number" step="0.01" value={valores.altura} onChange={(v) => actualizarCampo('altura', v)} error={erroresPorCampo.altura} />
        <CampoFecha label="Fecha de nacimiento" value={valores.fechaNacimiento} onChange={(v) => actualizarCampo('fechaNacimiento', v)} error={erroresPorCampo.fechaNacimiento} required maxDate={new Date()} />
        <CampoFecha label="Fecha de ingreso" value={valores.fechaIngreso} onChange={(v) => actualizarCampo('fechaIngreso', v)} error={erroresPorCampo.fechaIngreso} required />
      </div>

      <label className="cliente-form-campo cliente-form-observaciones">
        <span>Observaciones</span>
        <textarea value={valores.observaciones} onChange={(e) => actualizarCampo('observaciones', e.target.value)} rows={3} />
      </label>

      <button type="submit" disabled={guardando} className="cliente-form-boton">
        {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar cliente'}
      </button>
    </form>
  )
}

function Campo({ label, value, onChange, error, type = 'text', required = false, step }) {
  return (
    <label className="cliente-form-campo">
      <span>{label}{required && ' *'}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} className={error ? 'con-error' : ''} />
      {error && <small className="cliente-form-error">{error}</small>}
    </label>
  )
}

export default ClienteForm