package io.bookingmicroservices.audit.controllers;

import io.bookingmicroservices.audit.data.mongo.documents.AuditLogDocument;
import io.bookingmicroservices.audit.data.mongo.repositories.AuditLogRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(path = "api/v1/audit-log")
@Tag(name = "audit-log")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping()
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AuditLogDocument>> getAllAuditLogs() {
        List<AuditLogDocument> logs = auditLogRepository.findAll();
        return ResponseEntity.ok().body(logs);
    }

    @GetMapping("/type/{eventType}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AuditLogDocument>> getAuditLogsByType(@PathVariable String eventType) {
        // Can search by exact type name or class simple name containing it
        List<AuditLogDocument> logs = auditLogRepository.findAllByEventTypeIgnoreCase(eventType);
        if (logs.isEmpty()) {
            // Fallback: search if string is a substring (e.g. "BookingCreated" instead of full package path)
            logs = auditLogRepository.findAll().stream()
                    .filter(log -> log.getEventType().toLowerCase().contains(eventType.toLowerCase()))
                    .toList();
        }
        return ResponseEntity.ok().body(logs);
    }
}
