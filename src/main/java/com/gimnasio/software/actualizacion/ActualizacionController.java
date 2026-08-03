package com.gimnasio.software.actualizacion;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/actualizacion")
public class ActualizacionController {

    private final ActualizacionService servicio;
    private final ConfigurableApplicationContext contexto;

    public ActualizacionController(ActualizacionService servicio, ConfigurableApplicationContext contexto) {
        this.servicio = servicio;
        this.contexto = contexto;
    }

    @GetMapping("/estado")
    public Map<String, Object> estado() {
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("versionActual", servicio.getVersionActual());
        resultado.put("versionDisponible", servicio.getVersionRemota());
        resultado.put("descargando", servicio.isDescargando());
        resultado.put("listaParaInstalar", servicio.isListaParaInstalar());
        resultado.put("error", servicio.getError());
        return resultado;
    }

    @PostMapping("/aplicar")
    public java.util.Map<String, Object> aplicar() {
        java.util.Map<String, Object> resultado = new java.util.LinkedHashMap<>();

        if (!servicio.isListaParaInstalar()) {
            resultado.put("ok", false);
            resultado.put("mensaje", "No hay ninguna actualizacion lista para instalar.");
            return resultado;
        }

        try {
            new ProcessBuilder(servicio.getRutaInstalador(), "/quiet", "/norestart").start();
        } catch (Exception e) {
            System.out.println("ERROR al lanzar el instalador: " + e.getMessage());
            e.printStackTrace();
            resultado.put("ok", false);
            resultado.put("mensaje", "No se pudo iniciar el instalador: " + e.getMessage());
            return resultado;
        }

        new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ignored) {
            }
            int codigoSalida = SpringApplication.exit(contexto, () -> 0);
            System.exit(codigoSalida);
        }).start();

        resultado.put("ok", true);
        return resultado;
    }
}