package com.gimnasio.software.asistencias;

import com.gimnasio.software.clientes.Cliente;
import com.gimnasio.software.clientes.ClienteRepository;
import com.gimnasio.software.molinete.ControlMolineteService;
import com.gimnasio.software.pagos.Pago;
import com.gimnasio.software.pagos.PagoRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/asistencias")
public class AsistenciaController {

    private final AsistenciaRepository asistenciaRepository;
    private final ClienteRepository clienteRepository;
    private final PagoRepository pagoRepository;
    private final ControlMolineteService controlMolineteService;

    public AsistenciaController(
            AsistenciaRepository asistenciaRepository,
            ClienteRepository clienteRepository,
            PagoRepository pagoRepository,
            ControlMolineteService controlMolineteService
    ) {
        this.asistenciaRepository = asistenciaRepository;
        this.clienteRepository = clienteRepository;
        this.pagoRepository = pagoRepository;
        this.controlMolineteService = controlMolineteService;
    }

    @GetMapping("/total-historico")
    public Map<String, Long> totalHistorico() {
        long total = asistenciaRepository.contarVisitasTotalesHistorico();
        return Map.of("total", total);
    }

    @GetMapping
    public List<Asistencia> listar() {
        return asistenciaRepository.findAll();
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Asistencia> listarPorCliente(@PathVariable Long clienteId) {
        return asistenciaRepository.findByClienteIdOrderByFechaHoraDesc(clienteId);
    }

    @GetMapping("/hoy")
    public List<AsistenciaHoyResponse> listarHoy() {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicio = hoy.atStartOfDay();
        LocalDateTime fin = hoy.atTime(23, 59, 59);
        List<Asistencia> asistencias = asistenciaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(inicio, fin);

        List<Long> clienteIds = asistencias.stream()
                .map(a -> a.getCliente().getId())
                .distinct()
                .toList();

        Map<Long, Long> visitasPorCliente = clienteIds.isEmpty()
                ? Map.of()
                : asistenciaRepository.contarVisitasPorClientes(clienteIds).stream()
                        .collect(Collectors.toMap(VisitasPorCliente::getClienteId, VisitasPorCliente::getVisitas));

        return asistencias.stream()
                .map(a -> new AsistenciaHoyResponse(
                        a.getId(),
                        a.getCliente(),
                        a.getFechaHora(),
                        a.getEstado(),
                        a.getObservacion(),
                        visitasPorCliente.getOrDefault(a.getCliente().getId(), 0L)
                ))
                .toList();
    }

    @PostMapping("/registrar/{clienteId}")
    public Asistencia registrar(@PathVariable Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Optional<Pago> ultimoPago = pagoRepository.findFirstByClienteIdOrderByFechaVencimientoDesc(clienteId);

        Asistencia asistencia = new Asistencia();
        asistencia.setCliente(cliente);
        asistencia.setFechaHora(LocalDateTime.now());

        if (ultimoPago.isEmpty()) {
            asistencia.setEstado("RECHAZADO");
            asistencia.setObservacion("El cliente no tiene pagos registrados");
            return asistenciaRepository.save(asistencia);
        }

        LocalDate hoy = LocalDate.now();
        LocalDate fechaVencimiento = ultimoPago.get().getFechaVencimiento();

        if (fechaVencimiento.isBefore(hoy)) {
            asistencia.setEstado("RECHAZADO");
            asistencia.setObservacion("Cuota vencida el " + fechaVencimiento);
        } else {
            asistencia.setEstado("ACEPTADO");
            asistencia.setObservacion("Acceso permitido");
            controlMolineteService.abrirMolinete();
        }

        return asistenciaRepository.save(asistencia);
    }
}