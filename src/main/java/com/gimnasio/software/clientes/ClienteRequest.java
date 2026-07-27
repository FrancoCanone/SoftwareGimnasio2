package com.gimnasio.software.clientes;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ClienteRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Pattern(regexp = "^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$", message = "El nombre no puede tener números")
        String nombre,

        @NotBlank(message = "El apellido es obligatorio")
        @Pattern(regexp = "^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$", message = "El apellido no puede tener números")
        String apellido,

        @NotBlank(message = "El DNI es obligatorio")
        @Pattern(regexp = "^\\d{6,10}$", message = "El DNI debe tener entre 6 y 10 números")
        String dni,

        @NotBlank(message = "El celular es obligatorio")
        @Pattern(regexp = "^\\d{10}$", message = "El celular debe tener 10 números")
        String celular,

        String direccion,

        @Pattern(regexp = "^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]*$", message = "La ocupación no puede tener números")
        String ocupacion,

        @Pattern(regexp = "^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]*$", message = "La actividad previa no puede tener números")
        String actividadPrevia,

        String observaciones,

        @DecimalMin(value = "1.0", message = "El peso debe ser mayor a 1kg")
        @DecimalMax(value = "499.0", message = "El peso debe ser menor a 499kg")
        Double peso,

        @DecimalMin(value = "1.0", message = "La altura debe ser mayor a 1m")
        @DecimalMax(value = "3.0", message = "La altura debe ser menor a 3m")
        Double altura,

        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @PastOrPresent(message = "La fecha de nacimiento no puede ser futura")
        LocalDate fechaNacimiento,

        @NotNull(message = "La fecha de ingreso es obligatoria")
        LocalDate fechaIngreso
) {}