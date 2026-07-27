import { useState } from 'react'
import Panel from './components/Panel'
import ClienteForm from './components/ClienteForm'
import Planes from './components/Planes'
import Pagos from './components/Pagos'
import ClientesLista from './components/ClientesLista'
import IndicadorIngreso from './components/IndicadorIngreso'
import { cerrarPrograma, abrirModoIngreso } from './api/sistema'
import ToastContainer from './components/ToastContainer'
import ConfirmDialogHost from './components/ConfirmDialogHost'
import { confirmar } from './lib/confirmar'
import AvisoActualizacion from './components/AvisoActualizacion'
import './App.css'

function App() {
  const [vista, setVista] = useState('panel')
  const [abriendoIngreso, setAbriendoIngreso] = useState(false)
  
  async function manejarCerrarPrograma() {
    const confirmado = await confirmar('¿Cerrar el sistema? Esto apaga el programa por completo, no solo esta ventana.', {
      textoConfirmar: 'Cerrar',
    })
    if (!confirmado) return

    try {
      await cerrarPrograma()
    } catch {
      // es esperable que la conexion se corte antes de la respuesta, el proceso ya se esta cerrando
    }

    window.close()
  }

  return (
    <main className="app">
      <AvisoActualizacion />
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">IG</span>
          <div>
            <strong>Imagen Gym</strong>
            <small>Sistema de gestion</small>
          </div>
        </div>

        <nav className="nav">
          <button className={vista === 'panel' ? 'active' : ''} onClick={() => setVista('panel')}>Panel Principal</button>
          <button className={vista === 'clientes' ? 'active' : ''} onClick={() => setVista('clientes')}>Registro De Clientes</button>
          <button className={vista === 'planes' ? 'active' : ''} onClick={() => setVista('planes')}>Planes</button>
          <button className={vista === 'pagos' ? 'active' : ''} onClick={() => setVista('pagos')}>Registro de Pagos</button>
          <button className={vista === 'lista-clientes' ? 'active' : ''} onClick={() => setVista('lista-clientes')}>Ver clientes</button>
          <button
              className="nav-link-externo nav-boton-ingreso"
              disabled={abriendoIngreso}
              onClick={async () => {
                setAbriendoIngreso(true)
                await abrirModoIngreso()
                setTimeout(() => setAbriendoIngreso(false), 4000)}}>

            <span>{abriendoIngreso ? 'Abriendo...' : 'Abrir modo ingreso'}</span>
            <IndicadorIngreso />
          </button>
          <button className="nav-cerrar" onClick={manejarCerrarPrograma}>Cerrar programa</button>
        </nav>
      </aside>

      <section className="content">
        {vista === 'clientes' ? (
          <ClienteForm />
        ) : vista === 'planes' ? (
          <Planes />
        ) : vista === 'pagos' ? (
          <Pagos />
        ) : vista === 'lista-clientes' ? (
          <ClientesLista />
        ) : (
          <Panel />
        )}
      </section>

      <ToastContainer />
      <ConfirmDialogHost />

    </main>
    
  )
}

export default App