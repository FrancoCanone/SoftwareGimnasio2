const BASE_URL = '/api/planes'

export async function listarPlanes() {
  const respuesta = await fetch(BASE_URL)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los planes')
  }
  return respuesta.json()
}

export async function crearPlan(datos) {
  const respuesta = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const cuerpo = await respuesta.json()
  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje || 'No se pudo guardar el plan')
  }
  return cuerpo
}

export async function actualizarPlan(id, datos) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  const cuerpo = await respuesta.json()
  if (!respuesta.ok) {
    throw new Error(cuerpo.mensaje || 'No se pudo actualizar el plan')
  }
  return cuerpo
}

export async function eliminarPlan(id) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!respuesta.ok) {
    throw new Error('No se pudo eliminar el plan')
  }
}

export async function listarPlanesActivos() {
  const respuesta = await fetch(`${BASE_URL}/activos`)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los planes')
  }
  return respuesta.json()
}