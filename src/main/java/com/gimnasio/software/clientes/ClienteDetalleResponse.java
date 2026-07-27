package com.gimnasio.software.clientes;

import com.gimnasio.software.pagos.Pago;
import java.util.List;

public record ClienteDetalleResponse(
        Cliente cliente,
        List<Pago> pagos,
        long visitasTotales
) {}