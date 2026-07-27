import { useEffect, useState } from 'react'

function IndicadorIngreso() {
  const [activo, setActivo] = useState(false)

  useEffect(() => {
    const canal = new BroadcastChannel('ingreso-estado')

    canal.onmessage = (evento) => {
      setActivo(evento.data.tipo === 'activo')
    }

    return () => canal.close()
  }, [])

  return (
    <span
      className={`indicador-punto ${activo ? 'indicador-activo' : 'indicador-inactivo'}`}
      title={activo ? 'Modo ingreso enfocado' : 'Modo ingreso sin foco o cerrado'}
    />
  )
}

export default IndicadorIngreso