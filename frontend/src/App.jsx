import { useState } from 'react'
import './App.css'
import Panel from './components/Panel'
import ClienteForm from './components/ClienteForm'
import Planes from './components/Planes'
import Pagos from './components/Pagos'
import ClientesLista from './components/ClientesLista'
import Estadisticas from './components/Estadisticas'
import IndicadorIngreso from './components/IndicadorIngreso'
import Icono from './components/Icono'
import { cerrarPrograma, abrirModoIngreso } from './api/sistema'
import ToastContainer from './components/ToastContainer'
import ConfirmDialogHost from './components/ConfirmDialogHost'
import { confirmar } from './lib/confirmar'
import AvisoActualizacion, { EtiquetaVersion } from './components/AvisoActualizacion'

const VISTAS = [
  { id: 'panel', etiqueta: 'Panel principal', icono: 'panel' },
  { id: 'clientes', etiqueta: 'Registro de clientes', icono: 'clienteNuevo' },
  { id: 'planes', etiqueta: 'Planes', icono: 'planes' },
  { id: 'pagos', etiqueta: 'Registro de pagos', icono: 'pagos' },
  { id: 'lista-clientes', etiqueta: 'Ver clientes', icono: 'clientes' },
  { id: 'estadisticas', etiqueta: 'Estadísticas', icono: 'estadisticas' },
]

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

    }

    window.close()
  }

  return (
    <main className="app">
      <AvisoActualizacion />
      <aside className="sidebar">
        <div className="brand">
          <img src="IMAGEM-GYM.jpg" alt="Imagen Gym" className="brand-mark" />
          <div>
            <strong>Imagen Gym</strong>
            <small>Sistema de gestión</small>
          </div>
        </div>

        <nav className="nav">
          {VISTAS.map((item) => (
            <button
              key={item.id}
              className={vista === item.id ? 'active' : ''}
              onClick={() => setVista(item.id)}
            >
              <Icono nombre={item.icono} />
              <span>{item.etiqueta}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-pie">
          <button
              className="nav-link-externo nav-boton-ingreso"
              disabled={abriendoIngreso}
              onClick={async () => {
                setAbriendoIngreso(true)
                await abrirModoIngreso()
                setTimeout(() => setAbriendoIngreso(false), 4000)}}>

            <Icono nombre="ingreso" />
            <span>{abriendoIngreso ? 'Abriendo...' : 'Abrir modo ingreso'}</span>
            <IndicadorIngreso />
          </button>
          <button className="nav-cerrar" onClick={manejarCerrarPrograma}>
            <Icono nombre="apagar" />
            <span>Cerrar programa</span>
          </button>
          <EtiquetaVersion />
        </div>
      </aside>

      {/* key={vista} hace que la animacion de entrada se repita cada vez que se cambia de seccion */}
      <section className="content" key={vista}>
        <div className="content-inner">
          {vista === 'clientes' ? (
            <>
              <header className="topbar">
                <div>
                  <h1>Registro de clientes</h1>
                  <p>Alta de un nuevo socio del gimnasio</p>
                </div>
              </header>
              <ClienteForm />
            </>
          ) : vista === 'planes' ? (
            <Planes />
          ) : vista === 'pagos' ? (
            <Pagos />
          ) : vista === 'lista-clientes' ? (
            <ClientesLista />
          ) : vista === 'estadisticas' ? (
            <Estadisticas />
          ) : (
            <Panel />
          )}
        </div>
      </section>

      <ToastContainer />
      <ConfirmDialogHost />

    </main>

  )
}

export default App
