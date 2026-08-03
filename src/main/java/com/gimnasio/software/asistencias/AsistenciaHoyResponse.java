package com.gimnasio.software.asistencias;

import com.gimnasio.software.clientes.Cliente;
import java.time.LocalDateTime;

public record AsistenciaHoyResponse(
        Long id,
        Cliente cliente,
        LocalDateTime fechaHora,
        String estado,
        String observacion,
        long visitasTotales
) {}