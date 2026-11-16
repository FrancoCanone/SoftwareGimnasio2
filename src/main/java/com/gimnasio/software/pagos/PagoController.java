package com.gimnasio.software.pagos;

import com.gimnasio.software.clientes.Cliente;
import com.gimnasio.software.clientes.ClienteRepository;
import com.gimnasio.software.planes.Plan;
import com.gimnasio.software.planes.PlanRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoRepository pagoRepository;
    private final ClienteRepository clienteRepository;
    private final PlanRepository planRepository;

    public PagoController(
            PagoRepository pagoRepository,
            ClienteRepository clienteRepository,
            PlanRepository planRepository
    ) {
        this.pagoRepository = pagoRepository;
        this.clienteRepository = clienteRepository;
        this.planRepository = planRepository;
    }

    @GetMapping
    public List<Pago> listar() {
        return pagoRepository.findAll();
    }

    @GetMapping("/{id}")
    public Pago buscarPorId(@PathVariable Long id) {
        return pagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Pago> listarPorCliente(@PathVariable Long clienteId) {
        return pagoRepository.findByClienteIdOrderByFechaPagoDesc(clienteId);
    }

    @GetMapping("/cliente/{clienteId}/estado")
    public EstadoPagoResponse estadoCliente(@PathVariable Long clienteId) {
        Pago ultimoPago = pagoRepository.findFirstByClienteIdOrderByFechaVencimientoDesc(clienteId)
                .orElseThrow(() -> new RuntimeException("El cliente no tiene pagos registrados"));

        LocalDate hoy = LocalDate.now();
        String estado = !ultimoPago.getFechaVencimiento().isBefore(hoy) ? "ACTIVO" : "VENCIDO";

        return new EstadoPagoResponse(
                clienteId,
                estado,
                ultimoPago.getFechaPago(),
                ultimoPago.getFechaVencimiento(),
                ultimoPago.getPlan().getId(),
                ultimoPago.getPlan().getNombre()
        );
    }

    // Estado de la cuota de cada cliente que tiene al menos un pago (ACTIVO / VENCIDO).
    // Los clientes que no aparecen en la lista no tienen pagos registrados.
    @GetMapping("/estados")
    public List<EstadoPagoResponse> estadosDeClientes() {
        LocalDate hoy = LocalDate.now();
        Map<Long, Pago> ultimoPorCliente = new LinkedHashMap<>();
        for (Pago pago : pagoRepository.findUltimoPagoDeCadaCliente()) {
            ultimoPorCliente.putIfAbsent(pago.getCliente().getId(), pago);
        }

        return ultimoPorCliente.values().stream()
                .map(pago -> new EstadoPagoResponse(
                        pago.getCliente().getId(),
                        !pago.getFechaVencimiento().isBefore(hoy) ? "ACTIVO" : "VENCIDO",
                        pago.getFechaPago(),
                        pago.getFechaVencimiento(),
                        pago.getPlan().getId(),
                        pago.getPlan().getNombre()
                ))
                .toList();
    }

   @GetMapping("/vencidos")
public List<Pago> listarVencidos() {
    LocalDate hoy = LocalDate.now();
    return pagoRepository.findCuotasVencidas(hoy, hoy.minusMonths(2));
}

    @PostMapping
    public Pago crear(@RequestBody PagoRequest request) {
        Cliente cliente = clienteRepository.findById(request.clienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        LocalDate fechaPago = request.fechaPago() != null
                ? request.fechaPago()
                : LocalDate.now();

        LocalDate fechaVencimiento = fechaPago.plusDays(plan.getDuracionDias());

        Pago pago = new Pago();
        pago.setCliente(cliente);
        pago.setPlan(plan);
        pago.setMonto(request.monto() != null ? request.monto() : plan.getPrecio());
        pago.setMetodoPago(request.metodoPago());
        pago.setFechaPago(fechaPago);
        pago.setFechaVencimiento(fechaVencimiento);
        pago.setObservaciones(request.observaciones());

        return pagoRepository.save(pago);
    }

    @PutMapping("/{id}")
    public Pago actualizar(@PathVariable Long id, @RequestBody PagoRequest request) {
        Pago pago = pagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));

        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        LocalDate fechaPago = request.fechaPago() != null ? request.fechaPago() : pago.getFechaPago();
        LocalDate fechaVencimiento = fechaPago.plusDays(plan.getDuracionDias());

        pago.setPlan(plan);
        pago.setMonto(request.monto() != null ? request.monto() : plan.getPrecio());
        pago.setMetodoPago(request.metodoPago());
        pago.setFechaPago(fechaPago);
        pago.setFechaVencimiento(fechaVencimiento);
        pago.setObservaciones(request.observaciones());

        return pagoRepository.save(pago);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        pagoRepository.deleteById(id);
    }

    public record PagoRequest(
            Long clienteId,
            Long planId,
            Double monto,
            String metodoPago,
            LocalDate fechaPago,
            String observaciones
    ) {}

    public record EstadoPagoResponse(
        Long clienteId,
        String estado,
        LocalDate fechaPago,
        LocalDate fechaVencimiento,
        Long planId,
        String planNombre
    ) {}
}