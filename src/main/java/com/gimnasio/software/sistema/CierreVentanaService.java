package com.gimnasio.software.sistema;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Service;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

// Cierra el programa cuando se cierra la ventana principal con la X.
// No cierra al instante: espera unos segundos, porque recargar la pagina (F5) tambien 
// "cierra" la ventana por un momento. Si en ese tiempo la ventana vuelve a avisar que esta abierta, se cancela el cierre.


@Service
public class CierreVentanaService {

    private static final long ESPERA_SEGUNDOS = 6;

    private final ConfigurableApplicationContext contexto;
    private final EstadoIngresoService estadoIngresoService;

    private final ScheduledExecutorService temporizador = Executors.newSingleThreadScheduledExecutor(tarea -> {
        Thread hilo = new Thread(tarea, "cierre-ventana");
        hilo.setDaemon(true);
        return hilo;
    });

    private ScheduledFuture<?> cierrePendiente;

    public CierreVentanaService(ConfigurableApplicationContext contexto, EstadoIngresoService estadoIngresoService) {
        this.contexto = contexto;
        this.estadoIngresoService = estadoIngresoService;
    }

    public synchronized void ventanaAbierta() {
        cancelarCierrePendiente();
    }

    public synchronized void ventanaCerrada() {
        cancelarCierrePendiente();
        cierrePendiente = temporizador.schedule(this::cerrarSiSigueCerrada, ESPERA_SEGUNDOS, TimeUnit.SECONDS);
    }

    private void cancelarCierrePendiente() {
        if (cierrePendiente != null) {
            cierrePendiente.cancel(false);
            cierrePendiente = null;
        }
    }

    private void cerrarSiSigueCerrada() {
        // Si la pantalla de ingreso sigue abierta (por ejemplo en el monitor del molinete), no apagamos nada
        if (estadoIngresoService.estaAbierta()) {
            System.out.println("Se cerro la ventana principal, pero el modo ingreso sigue abierto: el programa sigue funcionando.");
            return;
        }

        System.out.println("Se cerro la ventana principal: cerrando el programa.");
        int codigoSalida = SpringApplication.exit(contexto, () -> 0);
        System.exit(codigoSalida);
    }
}
