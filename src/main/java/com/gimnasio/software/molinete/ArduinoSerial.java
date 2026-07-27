package com.gimnasio.software.molinete;

import com.fazecast.jSerialComm.SerialPort;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;
import java.io.OutputStream;

@Component
public class ArduinoSerial {

    private SerialPort puerto;
    private OutputStream salida;

    private final int BAUD = 9600;
    private final String PUERTO_FALLBACK = "COM8";

    @PostConstruct
    public void alIniciar() {
        conectar();
    }

    @PreDestroy
    public void alApagar() {
        cerrar();
    }

    private SerialPort detectarArduino() {
        SerialPort[] puertos = SerialPort.getCommPorts();
        SerialPort candidato = null;

        for (SerialPort p : puertos) {
            String desc = p.getDescriptivePortName().toLowerCase();
            String fabricante = p.getPortDescription().toLowerCase();
            String nombre = p.getSystemPortName();

            System.out.println("Detectado: " + nombre + " - " + desc);

            if (desc.contains("arduino") ||
                desc.contains("ch340") ||
                desc.contains("usb serial") ||
                fabricante.contains("arduino")) {

                System.out.println("Arduino detectado en: " + nombre);
                return p;
            }

            if (nombre.equalsIgnoreCase(PUERTO_FALLBACK)) {
                candidato = p;
            }
        }

        if (candidato != null) {
            System.out.println("Usando fallback: " + candidato.getSystemPortName());
            return candidato;
        }

        return null;
    }

    public synchronized boolean conectar() {
        try {
            cerrar();
            puerto = detectarArduino();

            if (puerto == null) {
                System.out.println("No se encontró Arduino");
                return false;
            }

            puerto.setComPortParameters(BAUD, 8, 1, 0);
            puerto.setComPortTimeouts(SerialPort.TIMEOUT_WRITE_BLOCKING, 0, 0);

            if (puerto.openPort()) {
                Thread.sleep(2000);
                salida = puerto.getOutputStream();
                salida.write("\n".getBytes());
                salida.flush();
                System.out.println("Conectado a " + puerto.getSystemPortName());
                return true;
            } else {
                System.out.println("No se pudo abrir el puerto");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

    public synchronized void enviar(String dato) {
        try {
            if (!asegurarConexion()) {
                System.out.println("Sin conexión disponible");
                return;
            }

            String comando = dato + "\n";
            salida.write(comando.getBytes());
            salida.flush();
            System.out.println("Enviado: " + dato);

        } catch (Exception e) {
            System.out.println("Error → reconectando...");
            e.printStackTrace();
            cerrar();

            for (int i = 0; i < 3; i++) {
                if (conectar()) return;
            }
        }
    }

    private boolean asegurarConexion() {
        try {
            if (puerto == null || !puerto.isOpen() || salida == null) {
                System.out.println("Reconectando...");
                if (conectar()) {
                    Thread.sleep(1500);
                    return true;
                }
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public synchronized void cerrar() {
        try {
            if (salida != null) {
                salida.close();
                salida = null;
            }
            if (puerto != null && puerto.isOpen()) {
                puerto.closePort();
                System.out.println("Puerto cerrado");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}