package com.gimnasio.software.molinete;

import org.springframework.stereotype.Service;
import java.util.Timer;
import java.util.TimerTask;

@Service
public class ControlMolineteService {

    private final ArduinoSerial serial;
    private final Timer timer;
    private TimerTask tareaActual;

    public ControlMolineteService(ArduinoSerial serial) {
        this.serial = serial;
        this.timer = new Timer();
    }

    public void abrirMolinete() {
        serial.enviar("OPEN");

        if (tareaActual != null) {
            tareaActual.cancel();
        }

        tareaActual = new TimerTask() {
            @Override
            public void run() {
                serial.enviar("CLOSE");
            }
        };

        timer.schedule(tareaActual, 5000);
    }
}