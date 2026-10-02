const BASE_URL = '/api/estadisticas'

export async function obtenerIngresosPorMes(meses = 12) {
  const respuesta = await fetch(`${BASE_URL}/ingresos-por-mes?meses=${meses}`)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los ingresos por mes')
  }
  return respuesta.json()
}

export async function obtenerAsistenciasPorMes(meses = 12) {
  const respuesta = await fetch(`${BASE_URL}/asistencias-por-mes?meses=${meses}`)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las asistencias por mes')
  }
  return respuesta.json()
}

export async function obtenerTopAsistidores(meses = 12, limite = 10) {
  const respuesta = await fetch(`${BASE_URL}/top-asistidores?meses=${meses}&limite=${limite}`)
  if (!respuesta.ok) {
    throw new Error('No se pudo cargar el ranking de asistencias')
  }
  return respuesta.json()
}

export async function obtenerClientesActivos(meses = 12) {
  const respuesta = await fetch(`${BASE_URL}/clientes-activos?meses=${meses}`)
  if (!respuesta.ok) {
    throw new Error('No se pudo cargar la cantidad de clientes activos')
  }
  return respuesta.json()
}