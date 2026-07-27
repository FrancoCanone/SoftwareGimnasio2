export async function obtenerEstadoActualizacion() {
  const respuesta = await fetch('/api/actualizacion/estado')
  if (!respuesta.ok) throw new Error('No se pudo consultar el estado de actualizacion')
  return respuesta.json()
}

export async function aplicarActualizacion() {
  await fetch('/api/actualizacion/aplicar', { method: 'POST' }).catch(() => {})
}