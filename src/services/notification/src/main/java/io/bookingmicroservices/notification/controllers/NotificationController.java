package io.bookingmicroservices.notification.controllers;

import io.bookingmicroservices.notification.data.mongo.documents.NotificationDocument;
import io.bookingmicroservices.notification.data.mongo.repositories.NotificationReadRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "api/v1/notification")
@Tag(name = "notification")
public class NotificationController {

    private final NotificationReadRepository notificationRepository;

    public NotificationController(NotificationReadRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping()
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<NotificationDocument>> getAllNotifications() {
        List<NotificationDocument> notifications = notificationRepository.findAll();
        return ResponseEntity.ok().body(notifications);
    }

    @GetMapping("/passenger/{passengerName}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<NotificationDocument>> getNotificationsByPassenger(@PathVariable String passengerName) {
        List<NotificationDocument> notifications = notificationRepository.findAllByPassengerNameIgnoreCase(passengerName);
        return ResponseEntity.ok().body(notifications);
    }
}
