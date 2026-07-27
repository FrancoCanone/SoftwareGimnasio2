let mostrarDialogo = null

export function registrarDialogoConfirmacion(funcion) {
  mostrarDialogo = funcion
}

export function confirmar(mensaje, opciones = {}) {
  if (!mostrarDialogo) {
    return Promise.resolve(window.confirm(mensaje))
  }
  return mostrarDialogo(mensaje, opciones)
}