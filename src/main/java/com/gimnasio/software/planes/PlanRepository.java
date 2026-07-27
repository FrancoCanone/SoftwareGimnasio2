package com.gimnasio.software.planes;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    List<Plan> findByActivoTrue();

    List<Plan> findByNombreContainingIgnoreCase(String nombre);

    Optional<Plan> findByNombre(String nombre);
}