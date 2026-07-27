package com.gimnasio.software.pagos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByClienteIdOrderByFechaPagoDesc(Long clienteId);
    Optional<Pago> findFirstByClienteIdOrderByFechaVencimientoDesc(Long clienteId);
    void deleteByClienteId(Long clienteId);

    @Query("""
        SELECT p FROM Pago p
        WHERE p.fechaVencimiento < :hoy
        AND p.fechaVencimiento >= :desde
        AND p.fechaVencimiento = (
            SELECT MAX(p2.fechaVencimiento) FROM Pago p2 WHERE p2.cliente = p.cliente
        )
        ORDER BY p.fechaVencimiento DESC
    """)
    List<Pago> findCuotasVencidas(@Param("hoy") LocalDate hoy, @Param("desde") LocalDate desde);
}