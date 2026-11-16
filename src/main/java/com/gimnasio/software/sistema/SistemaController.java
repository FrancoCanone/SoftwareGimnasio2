package com.gimnasio.software.sistema;

import com.gimnasio.software.arranque.AbridorNavegador;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sistema")
public class SistemaController {

    private final ConfigurableApplicationContext contexto;
    private final AbridorNavegador abridorNavegador;
    private final EstadoIngresoService estadoIngresoService;
    private final CierreVentanaService cierreVentanaService;

    public SistemaController(
            ConfigurableApplicationContext contexto,
            AbridorNavegador abridorNavegador,
            EstadoIngresoService estadoIngresoService,
            CierreVentanaService cierreVentanaService
    ) {
        this.contexto = contexto;
        this.abridorNavegador = abridorNavegador;
        this.estadoIngresoService = estadoIngresoService;
        this.cierreVentanaService = cierreVentanaService;
    }

    @PostMapping("/abrir-ingreso")
    public synchronized void abrirIngreso() {
        if (estadoIngresoService.estaAbierta()) {
            System.out.println("La ventana de ingreso ya esta activa, la enfoco en vez de abrir otra.");
            abridorNavegador.enfocarVentanaIngreso();
            return;
        }
        abridorNavegador.abrirEnModoApp("http://localhost:8080/ingreso.html");
    }

    @PostMapping("/ingreso/latido")
    public void latidoIngreso() {
        estadoIngresoService.marcarActiva();
    }

    @PostMapping("/ingreso/cerrar-estado")
    public void cerrarEstadoIngreso() {
        estadoIngresoService.marcarCerrada();
    }

    // La ventana principal avisa cuando se abre y cuando se cierra.
    // Solo se tiene en cuenta si viene de la misma PC: cerrar el sistema en el celular no apaga nada.
    @PostMapping("/ventana/abierta")
    public void ventanaAbierta(HttpServletRequest pedido) {
        if (esDeEstaPc(pedido)) {
            cierreVentanaService.ventanaAbierta();
        }
    }

    @PostMapping("/ventana/cerrada")
    public void ventanaCerrada(HttpServletRequest pedido) {
        if (esDeEstaPc(pedido)) {
            cierreVentanaService.ventanaCerrada();
        }
    }

    @PostMapping("/cerrar")
    public void cerrar() {
        new Thread(() -> {
            try {
                Thread.sleep(300);
            } catch (InterruptedException ignored) {
            }
            int codigoSalida = SpringApplication.exit(contexto, () -> 0);
            System.exit(codigoSalida);
        }).start();
    }

    private boolean esDeEstaPc(HttpServletRequest pedido) {
        String ip = pedido.getRemoteAddr();
        return "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip);
    }
}
