package com.gimnasio.software.planes;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/planes")
public class PlanController {

    private final PlanRepository planRepository;

    public PlanController(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @GetMapping
    public List<Plan> listar() {
        return planRepository.findAll();
    }

    @GetMapping("/activos")
    public List<Plan> listarActivos() {
        return planRepository.findByActivoTrue();
    }

    @GetMapping("/{id}")
    public Plan buscarPorId(@PathVariable Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
    }

    @GetMapping("/buscar")
    public List<Plan> buscar(@RequestParam String texto) {
        return planRepository.findByNombreContainingIgnoreCase(texto);
    }

    @PostMapping
    public Plan crear(@RequestBody Plan plan) {
        if (plan.getActivo() == null) {
            plan.setActivo(true);
        }

        return planRepository.save(plan);
    }

    @PutMapping("/{id}")
    public Plan actualizar(@PathVariable Long id, @RequestBody Plan datos) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        plan.setNombre(datos.getNombre());
        plan.setPrecio(datos.getPrecio());
        plan.setDuracionDias(datos.getDuracionDias());
        plan.setDescripcion(datos.getDescripcion());
        plan.setActivo(datos.getActivo());

        return planRepository.save(plan);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        planRepository.deleteById(id);
    }
}