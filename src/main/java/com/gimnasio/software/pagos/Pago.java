package com.gimnasio.software.pagos;

import com.gimnasio.software.clientes.Cliente;
import com.gimnasio.software.planes.Plan;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Cliente cliente;

    @ManyToOne
    private Plan plan;

    private Double monto;
    private String metodoPago;
    private LocalDate fechaPago;
    private LocalDate fechaVencimiento;
    private String observaciones;

    public Long getId() { return id; }
    public Cliente getCliente() { return cliente; }
    public Plan getPlan() { return plan; }
    public Double getMonto() { return monto; }
    public String getMetodoPago() { return metodoPago; }
    public LocalDate getFechaPago() { return fechaPago; }
    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public String getObservaciones() { return observaciones; }

    public void setId(Long id) { this.id = id; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public void setPlan(Plan plan) { this.plan = plan; }
    public void setMonto(Double monto) { this.monto = monto; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public void setFechaPago(LocalDate fechaPago) { this.fechaPago = fechaPago; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
