package com.gimnasio.software.asistencias;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findByClienteIdOrderByFechaHoraDesc(Long clienteId);
    List<Asistencia> findByFechaHoraBetweenOrderByFechaHoraDesc(LocalDateTime inicio, LocalDateTime fin);

    void deleteByClienteId(Long clienteId);
}