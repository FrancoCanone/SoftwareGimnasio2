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

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticasController {

    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;

    public EstadisticasController(PagoRepository pagoRepository, AsistenciaRepository asistenciaRepository) {
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
    }

    // GET /api/estadisticas/ingresos-por-mes?meses=12
    @GetMapping("/ingresos-por-mes")
    public List<IngresoMensual> ingresosPorMes(@RequestParam(defaultValue = "12") int meses) {
        LocalDate desde = LocalDate.now().minusMonths(meses).withDayOfMonth(1);
        return pagoRepository.ingresosPorMes(desde);
    }

    // GET /api/estadisticas/asistencias-por-mes?meses=12
    @GetMapping("/asistencias-por-mes")
    public List<AsistenciaMensual> asistenciasPorMes(@RequestParam(defaultValue = "12") int meses) {
        LocalDateTime desde = LocalDate.now().minusMonths(meses).withDayOfMonth(1).atStartOfDay();
        return asistenciaRepository.asistenciasPorMes(desde);
    }

    // GET /api/estadisticas/top-asistidores?meses=12&limite=10
    @GetMapping("/top-asistidores")
    public List<TopAsistidor> topAsistidores(
            @RequestParam(defaultValue = "12") int meses,
            @RequestParam(defaultValue = "10") int limite
    ) {
        LocalDateTime desde = LocalDate.now().minusMonths(meses).withDayOfMonth(1).atStartOfDay();
        return asistenciaRepository.topAsistidores(desde, limite);
    }
}
