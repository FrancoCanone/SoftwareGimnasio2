export async function obtenerEstadoActualizacion() {
  const respuesta = await fetch('/api/actualizacion/estado')
  if (!respuesta.ok) throw new Error('No se pudo consultar el estado de actualizacion')
  return respuesta.json()
}

export async function aplicarActualizacion() {
  const respuesta = await fetch('/api/actualizacion/aplicar', { method: 'POST' })
  const cuerpo = await respuesta.json().catch(() => ({ ok: false, mensaje: 'Respuesta invalida del servidor' }))
  return cuerpo
}