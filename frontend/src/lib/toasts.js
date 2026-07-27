let escuchadores = []
let contadorId = 0

export function suscribirseAToasts(callback) {
  escuchadores.push(callback)
  return () => {
    escuchadores = escuchadores.filter((cb) => cb !== callback)
  }
}

function notificar(mensaje, tipo, duracionMs) {
  const id = ++contadorId
  escuchadores.forEach((cb) => cb({ id, mensaje, tipo, duracionMs }))
  return id
}

export function notificarExito(mensaje, duracionMs = 3500) {
  return notificar(mensaje, 'exito', duracionMs)
}

export function notificarError(mensaje, duracionMs = 5000) {
  return notificar(mensaje, 'error', duracionMs)
}

export function notificarInfo(mensaje, duracionMs = 3500) {
  return notificar(mensaje, 'info', duracionMs)
}