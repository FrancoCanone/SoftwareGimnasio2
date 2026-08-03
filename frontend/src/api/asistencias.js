const BASE_URL = '/api/asistencias'

export async function listarAsistenciasHoy() {
  const respuesta = await fetch(`${BASE_URL}/hoy`)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las asistencias de hoy')
  }
  return respuesta.json()
}

export async function registrarAsistencia(clienteId) {
  const respuesta = await fetch(`${BASE_URL}/registrar/${clienteId}`, { method: 'POST' })
  if (!respuesta.ok) {
    throw new Error('No se pudo registrar el ingreso')
  }
  return respuesta.json()
}

export async function obtenerTotalHistorico() {
  const respuesta = await fetch(`${BASE_URL}/total-historico`)
  if (!respuesta.ok) {
    throw new Error('No se pudo obtener el total de asistencias')
  }
  return respuesta.json()
}