package com.gimnasio.software.clientes;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "clientes")


public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    
    
    private Long id;

    private String nombre;
    private String apellido;

    @Column(unique = true)
    private String dni;

    private String celular;
    private String direccion;
    private String ocupacion;
    private String actividadPrevia;
    private String observaciones;

    private Double peso;
    private Double altura;

    private LocalDate fechaNacimiento;
    private LocalDate fechaIngreso;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getApellido() { return apellido; }
    public String getDni() { return dni; }
    public String getCelular() { return celular; }
    public String getDireccion() { return direccion; }
    public String getOcupacion() { return ocupacion; }
    public String getActividadPrevia() { return actividadPrevia; }
    public String getObservaciones() { return observaciones; }
    public Double getPeso() { return peso; }
    public Double getAltura() { return altura; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public LocalDate getFechaIngreso() { return fechaIngreso; }

    public void setId(Long id) { this.id = id; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public void setDni(String dni) { this.dni = dni; }
    public void setCelular(String celular) { this.celular = celular; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public void setOcupacion(String ocupacion) { this.ocupacion = ocupacion; }
    public void setActividadPrevia(String actividadPrevia) { this.actividadPrevia = actividadPrevia; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public void setPeso(Double peso) { this.peso = peso; }
    public void setAltura(Double altura) { this.altura = altura; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public void setFechaIngreso(LocalDate fechaIngreso) { this.fechaIngreso = fechaIngreso; }



}
