package com.gimnasio.software;

import com.gimnasio.software.arranque.BloqueoInstanciaUnica;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.awt.Desktop;
import java.net.URI;

@SpringBootApplication
@EnableScheduling
public class SoftwareGimnasioApplication {

    public static void main(String[] args) {
        if (!BloqueoInstanciaUnica.intentarTomarControl()) {
            System.out.println("Imagen Gym ya esta corriendo. Abriendo la ventana existente...");
            abrirNavegadorYSalir();
            return;
        }

        SpringApplication.run(SoftwareGimnasioApplication.class, args);
    }

    private static void abrirNavegadorYSalir() {
        try {
            if (Desktop.isDesktopSupported()) {
                Desktop.getDesktop().browse(new URI("http://localhost:8080"));
            }
        } catch (Exception e) {
            System.out.println("No se pudo abrir el navegador: " + e.getMessage());
        }
    }
}