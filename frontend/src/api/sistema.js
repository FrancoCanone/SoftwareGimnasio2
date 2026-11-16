
export async function abrirModoIngreso() {
  const controlador = new AbortController()
  const timeout = setTimeout(() => controlador.abort(), 8000)

  try {
    await fetch('/api/sistema/abrir-ingreso', { method: 'POST', signal: controlador.signal })
  } catch (err) {
    console.error('No se pudo abrir el modo ingreso a tiempo:', err)
  } finally {
    clearTimeout(timeout)
  }
}

export async function cerrarPrograma() {
  await fetch('/api/sistema/cerrar', { method: 'POST' })
}

export async function avisarVentanaAbierta() {
  await fetch('/api/sistema/ventana/abierta', { method: 'POST' }).catch(() => {})
}

// sendBeacon se usa porque sigue enviando el aviso aunque la ventana ya se este cerrando
export function avisarVentanaCerrada() {
  navigator.sendBeacon('/api/sistema/ventana/cerrada')
}

export async function marcarIngresoActivo() {
  await fetch('/api/sistema/ingreso/latido', { method: 'POST' }).catch(() => {})
}

export async function marcarIngresoCerrado() {
  await fetch('/api/sistema/ingreso/cerrar-estado', { method: 'POST' }).catch(() => {})
}