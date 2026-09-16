package com.gimnasio.software.respaldo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gimnasio.software.asistencias.Asistencia;
import com.gimnasio.software.asistencias.AsistenciaRepository;
import com.gimnasio.software.clientes.Cliente;
import com.gimnasio.software.clientes.ClienteRepository;
import com.gimnasio.software.pagos.Pago;
import com.gimnasio.software.pagos.PagoRepository;
import com.gimnasio.software.planes.Plan;
import com.gimnasio.software.planes.PlanRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/respaldo")
public class RespaldoController {

    private final ClienteRepository clienteRepository;
    private final PlanRepository planRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RespaldoController(
        ClienteRepository clienteRepository,
        PlanRepository planRepository,
        PagoRepository pagoRepository,
        AsistenciaRepository asistenciaRepository
           
    ) {
        this.clienteRepository = clienteRepository;
        this.planRepository = planRepository;
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
        
    }

    @GetMapping("/descargar")
    public ResponseEntity<byte[]> descargar() throws Exception {
        RespaldoDatos datos = crearRespaldo();

        ByteArrayOutputStream salidaBytes = new ByteArrayOutputStream();

        try (ZipOutputStream zip = new ZipOutputStream(salidaBytes)) {
            zip.putNextEntry(new ZipEntry("respaldo-gimnasio.json"));
            zip.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(datos));
            zip.closeEntry();
        }

        String nombreArchivo = "respaldo-gimnasio-" + LocalDate.now() + ".zip";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + nombreArchivo)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(salidaBytes.toByteArray());
    }

    @PostMapping("/importar")
    @Transactional
    public ResumenImportacion importar(@RequestParam("archivo") MultipartFile archivo) throws Exception {
        RespaldoDatos datos = leerRespaldoDesdeZip(archivo);

        Map<Long, Cliente> clientesPorIdOriginal = new HashMap<>();
        Map<Long, Plan> planesPorIdOriginal = new HashMap<>();

        int clientesNuevos = 0;
        int planesNuevos = 0;
        int pagosNuevos = 0;
        int asistenciasNuevas = 0;

        for (ClienteRespaldo c : datos.clientes()) {
            Optional<Cliente> existente = clienteRepository.findByDni(c.dni());

            Cliente cliente = existente.orElseGet(Cliente::new);
            if (existente.isEmpty()) {
                cliente.setNombre(c.nombre());
                cliente.setApellido(c.apellido());
                cliente.setDni(c.dni());
                cliente.setCelular(c.celular());
                cliente.setDireccion(c.direccion());
                cliente.setOcupacion(c.ocupacion());
                cliente.setActividadPrevia(c.actividadPrevia());
                cliente.setObservaciones(c.observaciones());
                cliente.setPeso(c.peso());
                cliente.setAltura(c.altura());
                cliente.setFechaNacimiento(c.fechaNacimiento());
                cliente.setFechaIngreso(c.fechaIngreso());
                cliente = clienteRepository.save(cliente);
                clientesNuevos++;
            }

            clientesPorIdOriginal.put(c.id(), cliente);
        }

        for (PlanRespaldo p : datos.planes()) {
            Optional<Plan> existente = planRepository.findByNombre(p.nombre());

            Plan plan = existente.orElseGet(Plan::new);
            if (existente.isEmpty()) {
                plan.setNombre(p.nombre());
                plan.setPrecio(p.precio());
                plan.setDuracionDias(p.duracionDias());
                plan.setDescripcion(p.descripcion());
                plan.setActivo(p.activo());
                plan = planRepository.save(plan);
                planesNuevos++;
            }

            planesPorIdOriginal.put(p.id(), plan);
        }

        List<Pago> pagosExistentes = pagoRepository.findAll();

        for (PagoRespaldo p : datos.pagos()) {
            Cliente cliente = clientesPorIdOriginal.get(p.clienteId());
            Plan plan = planesPorIdOriginal.get(p.planId());

            if (cliente == null || plan == null) continue;

            boolean yaExiste = pagosExistentes.stream().anyMatch(pe ->
                    pe.getCliente().getDni().equals(cliente.getDni()) &&
                    pe.getPlan().getNombre().equals(plan.getNombre()) &&
                    Objects.equals(pe.getFechaPago(), p.fechaPago()) &&
                    Objects.equals(pe.getFechaVencimiento(), p.fechaVencimiento()) &&
                    Objects.equals(pe.getMonto(), p.monto())
            );

            if (yaExiste) continue;

            Pago pago = new Pago();
            pago.setCliente(cliente);
            pago.setPlan(plan);
            pago.setMonto(p.monto());
            pago.setMetodoPago(p.metodoPago());
            pago.setFechaPago(p.fechaPago());
            pago.setFechaVencimiento(p.fechaVencimiento());
            pago.setObservaciones(p.observaciones());

            pagoRepository.save(pago);
            pagosNuevos++;
        }

        List<Asistencia> asistenciasExistentes = asistenciaRepository.findAll();

        for (AsistenciaRespaldo a : datos.asistencias()) {
            Cliente cliente = clientesPorIdOriginal.get(a.clienteId());
            if (cliente == null) continue;

            boolean yaExiste = asistenciasExistentes.stream().anyMatch(ae ->
                    ae.getCliente().getDni().equals(cliente.getDni()) &&
                    Objects.equals(ae.getFechaHora(), a.fechaHora())
            );

            if (yaExiste) continue;

            Asistencia asistencia = new Asistencia();
            asistencia.setCliente(cliente);
            asistencia.setFechaHora(a.fechaHora());
            asistencia.setEstado(a.estado());
            asistencia.setObservacion(a.observacion());

            asistenciaRepository.save(asistencia);
            asistenciasNuevas++;
        }

        return new ResumenImportacion(clientesNuevos, planesNuevos, pagosNuevos, asistenciasNuevas);
    }

    private RespaldoDatos crearRespaldo() {
        List<ClienteRespaldo> clientes = clienteRepository.findAll().stream()
                .map(c -> new ClienteRespaldo(
                        c.getId(), c.getNombre(), c.getApellido(), c.getDni(), c.getCelular(),
                        c.getDireccion(), c.getOcupacion(), c.getActividadPrevia(), c.getObservaciones(),
                        c.getPeso(), c.getAltura(), c.getFechaNacimiento(), c.getFechaIngreso()
                ))
                .toList();

        List<PlanRespaldo> planes = planRepository.findAll().stream()
                .map(p -> new PlanRespaldo(
                        p.getId(), p.getNombre(), p.getPrecio(), p.getDuracionDias(),
                        p.getDescripcion(), p.getActivo()
                ))
                .toList();

        List<PagoRespaldo> pagos = pagoRepository.findAll().stream()
                .map(p -> new PagoRespaldo(
                        p.getId(), p.getCliente().getId(), p.getPlan().getId(), p.getMonto(),
                        p.getMetodoPago(), p.getFechaPago(), p.getFechaVencimiento(), p.getObservaciones()
                ))
                .toList();

        List<AsistenciaRespaldo> asistencias = asistenciaRepository.findAll().stream()
                .map(a -> new AsistenciaRespaldo(
                        a.getId(), a.getCliente().getId(), a.getFechaHora(),
                        a.getEstado(), a.getObservacion()
                ))
                .toList();

        return new RespaldoDatos(clientes, planes, pagos, asistencias);
    }

    private RespaldoDatos leerRespaldoDesdeZip(MultipartFile archivo) throws Exception {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(archivo.getBytes()))) {
            ZipEntry entrada;

            while ((entrada = zip.getNextEntry()) != null) {
                if (entrada.getName().endsWith(".json")) {
                    return objectMapper.readValue(zip, RespaldoDatos.class);
                }
            }
        }

        throw new IllegalArgumentException("El ZIP no contiene un archivo JSON de respaldo");
    }

    public record ResumenImportacion(
            int clientesNuevos,
            int planesNuevos,
            int pagosNuevos,
            int asistenciasNuevas
    ) {}

    public record RespaldoDatos(
            List<ClienteRespaldo> clientes,
            List<PlanRespaldo> planes,
            List<PagoRespaldo> pagos,
            List<AsistenciaRespaldo> asistencias
    ) {}

    public record ClienteRespaldo(
            Long id,
            String nombre,
            String apellido,
            String dni,
            String celular,
            String direccion,
            String ocupacion,
            String actividadPrevia,
            String observaciones,
            Double peso,
            Double altura,
            LocalDate fechaNacimiento,
            LocalDate fechaIngreso
    ) {}

    public record PlanRespaldo(
            Long id,
            String nombre,
            Double precio,
            Integer duracionDias,
            String descripcion,
            Boolean activo
    ) {}

    public record PagoRespaldo(
            Long id,
            Long clienteId,
            Long planId,
            Double monto,
            String metodoPago,
            LocalDate fechaPago,
            LocalDate fechaVencimiento,
            String observaciones
    ) {}

    public record AsistenciaRespaldo(
            Long id,
            Long clienteId,
            LocalDateTime fechaHora,
            String estado,
            String observacion
    ) {}
}