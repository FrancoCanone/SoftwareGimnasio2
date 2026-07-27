package com.gimnasio.software.clientes;

import com.gimnasio.software.pagos.Pago;
import com.gimnasio.software.pagos.PagoRepository;
import com.gimnasio.software.asistencias.AsistenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PagoRepository pagoRepository;
    private final AsistenciaRepository asistenciaRepository;

    public ClienteService(ClienteRepository clienteRepository,
                           PagoRepository pagoRepository,
                           AsistenciaRepository asistenciaRepository) {
        this.clienteRepository = clienteRepository;
        this.pagoRepository = pagoRepository;
        this.asistenciaRepository = asistenciaRepository;
    }

    public List<Cliente> listar() {
        return clienteRepository.findAll();
    }

    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ClienteNoEncontradoException("Cliente no encontrado (id " + id + ")"));
    }

    public Cliente buscarPorDni(String dni) {
        return clienteRepository.findByDni(dni)
                .orElseThrow(() -> new ClienteNoEncontradoException("No hay ningún cliente con DNI " + dni));
    }

    public List<Cliente> buscar(String texto) {
        return clienteRepository.findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCase(texto, texto);
    }

    @Transactional
    public Cliente crear(ClienteRequest datos) {
        if (clienteRepository.findByDni(datos.dni()).isPresent()) {
            throw new DniDuplicadoException("Ya existe un cliente con el DNI " + datos.dni());
        }

        Cliente cliente = new Cliente();
        aplicarDatos(cliente, datos);
        cliente.setFechaIngreso(datos.fechaIngreso() != null ? datos.fechaIngreso() : LocalDate.now());

        return clienteRepository.save(cliente);
    }

    @Transactional
    public Cliente actualizar(Long id, ClienteRequest datos) {
        Cliente cliente = buscarPorId(id);

        if (!cliente.getDni().equals(datos.dni())) {
            clienteRepository.findByDni(datos.dni()).ifPresent(otro -> {
                throw new DniDuplicadoException("Ya existe un cliente con el DNI " + datos.dni());
            });
        }

        aplicarDatos(cliente, datos);
        return clienteRepository.save(cliente);
    }

    @Transactional
    public void eliminar(Long id) {
        buscarPorId(id);
        asistenciaRepository.deleteByClienteId(id);
        pagoRepository.deleteByClienteId(id);
        clienteRepository.deleteById(id);
    }

    public ClienteDetalleResponse obtenerDetalle(Long id) {
        Cliente cliente = buscarPorId(id);
        List<Pago> pagos = pagoRepository.findByClienteIdOrderByFechaPagoDesc(id);
        long visitasTotales = asistenciaRepository.findByClienteIdOrderByFechaHoraDesc(id).size();

        return new ClienteDetalleResponse(cliente, pagos, visitasTotales);
    }

    private void aplicarDatos(Cliente cliente, ClienteRequest datos) {
        cliente.setNombre(datos.nombre().trim());
        cliente.setApellido(datos.apellido().trim());
        cliente.setDni(datos.dni());
        cliente.setCelular(datos.celular());
        cliente.setDireccion(datos.direccion());
        cliente.setOcupacion(datos.ocupacion());
        cliente.setActividadPrevia(datos.actividadPrevia());
        cliente.setObservaciones(datos.observaciones());
        cliente.setPeso(datos.peso());
        cliente.setAltura(datos.altura());
        cliente.setFechaNacimiento(datos.fechaNacimiento());
    }
}