// En el celular las tablas se muestran como tarjetas, y cada dato necesita su titulo al lado
// ("Vence", "Monto", etc.). Esto copia el texto de cada encabezado a las celdas de su columna
// (como data-label), asi el CSS de movil.css lo puede mostrar sin tocar cada pantalla.

function etiquetarTablas() {
  document.querySelectorAll('table.tabla-panel').forEach((tabla) => {
    const titulos = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim())

    tabla.querySelectorAll('tbody tr').forEach((fila) => {
      ;[...fila.children].forEach((celda, indice) => {
        const titulo = titulos[indice] || ''
        if (celda.dataset.label !== titulo) celda.dataset.label = titulo
      })
    })
  })
}

// Vuelve a etiquetar cada vez que React agrega filas o cambia de pantalla
export function observarTablas() {
  etiquetarTablas()
  const observador = new MutationObserver(etiquetarTablas)
  observador.observe(document.body, { childList: true, subtree: true })
  return () => observador.disconnect()
}
