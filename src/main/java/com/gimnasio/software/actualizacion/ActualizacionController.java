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
    public void aplicar() throws Exception {
        if (!servicio.isListaParaInstalar()) return;

        new ProcessBuilder(servicio.getRutaInstalador(), "/quiet", "/norestart").start();

        new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ignored) {
            }
            int codigoSalida = SpringApplication.exit(contexto, () -> 0);
            System.exit(codigoSalida);
        }).start();
    }
}