package com.gimnasio.software.estadisticas;

import com.gimnasio.software.asistencias.AsistenciaMensual;
import com.gimnasio.software.asistencias.AsistenciaRepository;
import com.gimnasio.software.asistencias.TopAsistidor;
import com.gimnasio.software.pagos.IngresoMensual;
import com.gimnasio.software.pagos.PagoRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticasController {

    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;

    public EstadisticasController(PagoRepository pagoRepository, AsistenciaRepository asistenciaRepository) {
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
    }

    // meses=1 -> solo el mes actual. meses=3 -> mes actual + los 2 anteriores. etc.
    private LocalDate calcularDesde(int meses) {
        int cantidad = Math.max(meses, 1);
        return LocalDate.now().withDayOfMonth(1).minusMonths(cantidad - 1L);
    }

    @GetMapping("/ingresos-por-mes")
    public List<IngresoMensual> ingresosPorMes(@RequestParam(defaultValue = "12") int meses) {
        return pagoRepository.ingresosPorMes(calcularDesde(meses));
    }

    @GetMapping("/asistencias-por-mes")
    public List<AsistenciaMensual> asistenciasPorMes(@RequestParam(defaultValue = "12") int meses) {
        LocalDateTime desde = calcularDesde(meses).atStartOfDay();
        return asistenciaRepository.asistenciasPorMes(desde);
    }

    @GetMapping("/top-asistidores")
    public List<TopAsistidor> topAsistidores(
            @RequestParam(defaultValue = "12") int meses,
            @RequestParam(defaultValue = "10") int limite
    ) {
        LocalDateTime desde = calcularDesde(meses).atStartOfDay();
        return asistenciaRepository.topAsistidores(desde, limite);
    }

    // GET /api/estadisticas/clientes-activos?meses=1  -> cuantos clientes DISTINTOS asistieron en el periodo
    @GetMapping("/clientes-activos")
    public Map<String, Long> clientesActivos(@RequestParam(defaultValue = "12") int meses) {
        LocalDateTime desde = calcularDesde(meses).atStartOfDay();
        long total = asistenciaRepository.contarClientesDistintos(desde);
        return Map.of("total", total);
    }
}