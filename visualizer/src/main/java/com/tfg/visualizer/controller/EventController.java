package com.tfg.visualizer.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/event")
@CrossOrigin
public class EventController {

    private final SimpMessagingTemplate messagingTemplate;

    public EventController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public void receiveEvent(@RequestBody Map<String, Object> event) {

        System.out.println("Evento recibido: " + event);

        // enviar al frontend en tiempo real
        messagingTemplate.convertAndSend("/topic/events", (Object) event);
    }
}