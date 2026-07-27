const BASE_URL = '/api/pagos'

export async function listarPagos() {
  const respuesta = await fetch(BASE_URL)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar los pagos')
  }
  return respuesta.json()
}

export async function crearPago(datos) {
  const respuesta = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })

  if (!respuesta.ok) {
    let mensaje = 'No se pudo registrar el pago'
    try {
      const cuerpo = await respuesta.json()
      mensaje = cuerpo.mensaje || mensaje
    } catch {
      // el backend de pagos todavia no devuelve siempre JSON en los errores, usamos el mensaje generico
    }
    throw new Error(mensaje)
  }

  return respuesta.json()
}

export async function listarCuotasVencidas() {
  const respuesta = await fetch(`${BASE_URL}/vencidos`)
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las cuotas vencidas')
  }
  return respuesta.json()
}

export async function obtenerUltimoPagoCliente(clienteId) {
  const respuesta = await fetch(`${BASE_URL}/cliente/${clienteId}`)
  if (!respuesta.ok) {
    throw new Error('No se pudo consultar el pago del cliente')
  }
  const pagos = await respuesta.json()
  return pagos.length > 0 ? pagos[0] : null
}