package com.gimnasio.software.clientes;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public List<Cliente> listar() {
        return clienteService.listar();
    }

    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id);
    }

    @GetMapping("/{id}/detalle")
    public ClienteDetalleResponse detalle(@PathVariable Long id) {
        return clienteService.obtenerDetalle(id);
    }

    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String texto) {
        return clienteService.buscar(texto);
    }

    @GetMapping("/dni/{dni}")
    public Cliente buscarPorDni(@PathVariable String dni) {
        return clienteService.buscarPorDni(dni);
    }

    @PostMapping
    public Cliente crear(@Valid @RequestBody ClienteRequest datos) {
        return clienteService.crear(datos);
    }

    @PutMapping("/{id}")
    public Cliente actualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest datos) {
        return clienteService.actualizar(id, datos);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
    }
}