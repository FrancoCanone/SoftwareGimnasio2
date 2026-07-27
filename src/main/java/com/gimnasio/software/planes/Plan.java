package com.gimnasio.software.planes;

import jakarta.persistence.*;

@Entity
@Table(name = "planes")

public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private Double precio;
    private Integer duracionDias;
    private String descripcion;
    private Boolean activo = true;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public Double getPrecio() { return precio; }
    public Integer getDuracionDias() { return duracionDias; }
    public String getDescripcion() { return descripcion; }
    public Boolean getActivo() { return activo; }

    public void setId(Long id) { this.id = id; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setPrecio(Double precio) { this.precio = precio; }
    public void setDuracionDias(Integer duracionDias) { this.duracionDias = duracionDias; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}