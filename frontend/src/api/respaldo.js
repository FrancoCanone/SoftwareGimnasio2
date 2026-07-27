export async function importarRespaldo(archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)

  const respuesta = await fetch('/api/respaldo/importar', {
    method: 'POST',
    body: formData,
  })

  if (!respuesta.ok) {
    throw new Error('No se pudo importar el respaldo')
  }

  return respuesta.json()
}