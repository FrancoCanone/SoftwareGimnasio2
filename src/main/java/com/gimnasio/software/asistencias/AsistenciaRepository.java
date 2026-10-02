package com.gimnasio.software.asistencias;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {

    List<Asistencia> findByClienteIdOrderByFechaHoraDesc(Long clienteId);
    List<Asistencia> findByFechaHoraBetweenOrderByFechaHoraDesc(LocalDateTime inicio, LocalDateTime fin);

    void deleteByClienteId(Long clienteId);

    @Query(value = "SELECT COUNT(*) FROM (SELECT DISTINCT cliente_id, DATE(fecha_hora) AS dia FROM asistencias) AS t", nativeQuery = true)
    long contarVisitasTotalesHistorico();

    @Query(value = "SELECT cliente_id AS clienteId, COUNT(DISTINCT DATE(fecha_hora)) AS visitas " +
            "FROM asistencias WHERE cliente_id IN :clienteIds GROUP BY cliente_id", nativeQuery = true)
    List<VisitasPorCliente> contarVisitasPorClientes(@Param("clienteIds") List<Long> clienteIds);

    @Query(value = "SELECT DATE_FORMAT(fecha_hora, '%Y-%m') AS mes, COUNT(*) AS total " +
            "FROM asistencias WHERE estado = 'ACEPTADO' AND fecha_hora >= :desde " +
            "GROUP BY mes ORDER BY mes", nativeQuery = true)
    List<AsistenciaMensual> asistenciasPorMes(@Param("desde") LocalDateTime desde);

    @Query(value = "SELECT c.id AS clienteId, c.nombre AS nombre, c.apellido AS apellido, COUNT(*) AS total " +
            "FROM asistencias a JOIN clientes c ON c.id = a.cliente_id " +
            "WHERE a.estado = 'ACEPTADO' AND a.fecha_hora >= :desde " +
            "GROUP BY c.id, c.nombre, c.apellido ORDER BY total DESC LIMIT :limite", nativeQuery = true)
    List<TopAsistidor> topAsistidores(@Param("desde") LocalDateTime desde, @Param("limite") int limite);

    // Cuenta clientes DISTINTOS que asistieron al menos una vez desde una fecha (no cuenta visitas repetidas).
    @Query(value = "SELECT COUNT(DISTINCT cliente_id) FROM asistencias WHERE estado = 'ACEPTADO' AND fecha_hora >= :desde", nativeQuery = true)
    long contarClientesDistintos(@Param("desde") LocalDateTime desde);
}