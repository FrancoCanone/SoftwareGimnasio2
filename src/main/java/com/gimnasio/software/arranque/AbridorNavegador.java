package com.gimnasio.software.arranque;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.awt.Desktop;
import java.io.File;
import java.net.URI;

@Component
public class AbridorNavegador {

    private static final String URL_PANEL = "http://localhost:8080";
    private static final String TITULO_VENTANA_INGRESO = "Imagen Gym - Ingreso";

    private static final String[] RUTAS_EDGE = {
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    };

    private static final String[] RUTAS_CHROME = {
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    };

    @EventListener(ApplicationReadyEvent.class)
    public void abrirVentanaInicial() {
        abrirEnModoApp(URL_PANEL);
    }

    public void abrirEnModoApp(String url) {
        if (intentarAbrirComoApp(RUTAS_EDGE, url)) return;
        if (intentarAbrirComoApp(RUTAS_CHROME, url)) return;
        abrirEnNavegadorPorDefecto(url);
    }

    // Mejor esfuerzo: intenta traer al frente la ventana de ingreso si ya existe.
    // No es critico si falla - la deteccion real de "esta abierta" ahora la hace EstadoIngresoService.
    public void enfocarVentanaIngreso() {
        try {
            String script = "(New-Object -ComObject WScript.Shell).AppActivate('" + TITULO_VENTANA_INGRESO + "')";
            new ProcessBuilder("powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", script).start();
        } catch (Exception e) {
            System.out.println("No se pudo enfocar la ventana existente: " + e.getMessage());
        }
    }

    private boolean intentarAbrirComoApp(String[] rutasPosibles, String url) {
        for (String ruta : rutasPosibles) {
            File ejecutable = new File(ruta);
            if (ejecutable.exists()) {
                try {
                    new ProcessBuilder(ruta, "--app=" + url, "--window-size=1366,850").start();
                    return true;
                } catch (Exception e) {
                    System.out.println("No se pudo abrir " + ruta + ": " + e.getMessage());
                }
            }
        }
        return false;
    }

    private void abrirEnNavegadorPorDefecto(String url) {
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(new URI(url));
            } else {
                System.out.println("Abri manualmente: " + url);
            }
        } catch (Exception e) {
            System.out.println("No se pudo abrir el navegador automaticamente: " + e.getMessage());
        }
    }
}