const BASE_URL = '/api/clientes'

export async function listarClientes() {
  const respuesta = await fetch(BASE_URL)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los clientes')
  }
  return respuesta.json()
}

export async function crearCliente(datos) {
  const respuesta = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })

  const cuerpo = await respuesta.json()

  if (!respuesta.ok) {
    const error = new Error(cuerpo.mensaje || 'No se pudo guardar el cliente')
    error.erroresPorCampo = cuerpo.mensaje ? null : cuerpo
    throw error
  }

  return cuerpo
}

export async function buscarClientes(texto) {
  const respuesta = await fetch(`${BASE_URL}/buscar?texto=${encodeURIComponent(texto)}`)
  if (!respuesta.ok) {
    throw new Error('No se pudo buscar el cliente')
  }
  return respuesta.json()
}

export async function buscarClientePorDni(dni) {
  const respuesta = await fetch(`${BASE_URL}/dni/${encodeURIComponent(dni)}`)
  if (respuesta.status === 404) {
    return null
  }
  if (!respuesta.ok) {
    throw new Error('No se pudo buscar el cliente')
  }
  return respuesta.json()
}

export async function obtenerDetalleCliente(id) {
  const respuesta = await fetch(`${BASE_URL}/${id}/detalle`)
  if (!respuesta.ok) {
    throw new Error('No se pudo cargar el detalle del cliente')
  }
  return respuesta.json()
}

export async function actualizarCliente(id, datos) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })

  const cuerpo = await respuesta.json()

  if (!respuesta.ok) {
    const error = new Error(cuerpo.mensaje || 'No se pudo actualizar el cliente')
    error.erroresPorCampo = cuerpo.mensaje ? null : cuerpo
    throw error
  }

  return cuerpo
}

export async function eliminarCliente(id) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!respuesta.ok) {
    throw new Error('No se pudo eliminar el cliente')
  }
}