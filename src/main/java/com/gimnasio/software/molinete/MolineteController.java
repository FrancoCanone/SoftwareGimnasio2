package com.gimnasio.software.molinete;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/molinete")
public class MolineteController {

    private final ControlMolineteService controlMolineteService;

    public MolineteController(ControlMolineteService controlMolineteService) {
        this.controlMolineteService = controlMolineteService;
    }

    @PostMapping("/abrir")
    public void abrir() {
        controlMolineteService.abrirMolinete();
    }
}