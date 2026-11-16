package com.gimnasio.software.actualizacion;

import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
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
    public Map<String, Object> aplicar() {
        Map<String, Object> resultado = new LinkedHashMap<>();

        if (!servicio.isListaParaInstalar()) {
            resultado.put("ok", false);
            resultado.put("mensaje", "No hay ninguna actualizacion lista para instalar.");
            return resultado;
        }

        try {
            lanzarInstalador(servicio.getRutaInstalador());
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

    
    private void lanzarInstalador(String rutaInstalador) throws Exception {
        File instalador = new File(rutaInstalador);
        File registro = new File(instalador.getParentFile(), "instalacion.log");

        
        String rutaPrograma = System.getProperty("jpackage.app-path");

        StringBuilder script = new StringBuilder();
        script.append("Start-Sleep -Seconds 3; ");
        script.append("try { Start-Process -FilePath ").append(comillas(instalador.getAbsolutePath()))
                
                .append(" -ArgumentList '/passive','/norestart','/l*v',([char]34 + ").append(comillas(registro.getAbsolutePath())).append(" + [char]34)")
                .append(" -Verb RunAs -Wait } catch { }; ");
        if (rutaPrograma != null && !rutaPrograma.isBlank()) {
            script.append("Start-Process -FilePath ").append(comillas(rutaPrograma));
        }

        new ProcessBuilder("powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                "-WindowStyle", "Hidden", "-Command", script.toString()).start();
    }

    
    private static String comillas(String texto) {
        return "'" + texto.replace("'", "''") + "'";
    }
}
