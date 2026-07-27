package com.gimnasio.software.sistema;

import org.springframework.stereotype.Service;

@Service
public class EstadoIngresoService {

    private static final long VENTANA_SIN_LATIDO_MS = 15000; 

    private volatile long ultimoLatido = 0;

    public void marcarActiva() {
        ultimoLatido = System.currentTimeMillis();
    }

    public void marcarCerrada() {
        ultimoLatido = 0;
    }

    public boolean estaAbierta() {
        return ultimoLatido != 0 && (System.currentTimeMillis() - ultimoLatido) < VENTANA_SIN_LATIDO_MS;
    }
}