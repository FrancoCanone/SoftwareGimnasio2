package com.gimnasio.software.sistema;

import com.gimnasio.software.arranque.AbridorNavegador;
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

    public SistemaController(
            ConfigurableApplicationContext contexto,
            AbridorNavegador abridorNavegador,
            EstadoIngresoService estadoIngresoService
    ) {
        this.contexto = contexto;
        this.abridorNavegador = abridorNavegador;
        this.estadoIngresoService = estadoIngresoService;
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
}