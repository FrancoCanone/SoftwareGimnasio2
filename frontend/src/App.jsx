import { useEffect, useState } from 'react'
import './App.css'
import Panel from './components/Panel'
import ClienteForm from './components/ClienteForm'
import Planes from './components/Planes'
import Pagos from './components/Pagos'
import ClientesLista from './components/ClientesLista'
import Estadisticas from './components/Estadisticas'
import IndicadorIngreso from './components/IndicadorIngreso'
import Icono from './components/Icono'
import { cerrarPrograma, abrirModoIngreso, avisarVentanaAbierta, avisarVentanaCerrada } from './api/sistema'
import ToastContainer from './components/ToastContainer'
import ConfirmDialogHost from './components/ConfirmDialogHost'
import { confirmar } from './lib/confirmar'
import { observarTablas } from './lib/etiquetasTablas'
import AvisoActualizacion, { EtiquetaVersion } from './components/AvisoActualizacion'
// movil.css tiene que ser el ultimo import, para poder ajustar los estilos de todas las pantallas
import './movil.css'

const VISTAS = [
  { id: 'panel', etiqueta: 'Panel principal', corta: 'Panel', icono: 'panel' },
  { id: 'clientes', etiqueta: 'Registro de clientes', icono: 'clienteNuevo' },
  { id: 'planes', etiqueta: 'Planes', corta: 'Planes', icono: 'planes' },
  { id: 'pagos', etiqueta: 'Registro de pagos', corta: 'Pagos', icono: 'pagos' },
  { id: 'lista-clientes', etiqueta: 'Ver clientes', corta: 'Clientes', icono: 'clientes' },
  { id: 'estadisticas', etiqueta: 'Estadísticas', icono: 'estadisticas' },
]

// Celular: estas cuatro van en la barra de abajo; el resto queda en "Más"
const VISTAS_BARRA = ['panel', 'lista-clientes', 'pagos', 'planes'].map((id) => VISTAS.find((v) => v.id === id))
const VISTAS_MAS = VISTAS.filter((v) => !VISTAS_BARRA.includes(v))

function App() {
  const [vista, setVista] = useState('panel')
  const [abriendoIngreso, setAbriendoIngreso] = useState(false)
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)

  useEffect(() => observarTablas(), [])

  // Cerrar la ventana con la X apaga el programa (el backend espera unos segundos por si fue un F5)
  useEffect(() => {
    avisarVentanaAbierta()
    window.addEventListener('pagehide', avisarVentanaCerrada)
    return () => window.removeEventListener('pagehide', avisarVentanaCerrada)
  }, [])

  function cambiarVista(id) {
    setVista(id)
    setMenuMasAbierto(false)
    window.scrollTo(0, 0)
  }

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

  const masActivo = menuMasAbierto || VISTAS_MAS.some((v) => v.id === vista)

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
              onClick={() => cambiarVista(item.id)}
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

      {/* Solo se ve en el celular (ver movil.css) */}
      <header className="encabezado-movil">
        <img src="IMAGEM-GYM.jpg" alt="" className="brand-mark" />
        <strong>Imagen Gym</strong>
      </header>

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

      {/* Barra de abajo y menu "Más": solo se ven en el celular (ver movil.css) */}
      <nav className="barra-inferior">
        {VISTAS_BARRA.map((item) => (
          <button
            key={item.id}
            className={vista === item.id && !menuMasAbierto ? 'active' : ''}
            onClick={() => cambiarVista(item.id)}
          >
            <Icono nombre={item.icono} size={22} />
            <span>{item.corta}</span>
          </button>
        ))}
        <button className={masActivo ? 'active' : ''} onClick={() => setMenuMasAbierto(!menuMasAbierto)}>
          <Icono nombre="mas" size={22} />
          <span>Más</span>
        </button>
      </nav>

      {menuMasAbierto && (
        <div className="hoja-mas-fondo" onClick={() => setMenuMasAbierto(false)}>
          <div className="hoja-mas" onClick={(e) => e.stopPropagation()}>
            <div className="hoja-mas-agarre" />
            {VISTAS_MAS.map((item) => (
              <button
                key={item.id}
                className={vista === item.id ? 'active' : ''}
                onClick={() => cambiarVista(item.id)}
              >
                <Icono nombre={item.icono} size={20} />
                <span>{item.etiqueta}</span>
              </button>
            ))}
            <EtiquetaVersion />
          </div>
        </div>
      )}

      <ToastContainer />
      <ConfirmDialogHost />

    </main>

  )
}

export default App
