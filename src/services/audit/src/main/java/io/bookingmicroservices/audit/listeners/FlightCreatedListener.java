package io.bookingmicroservices.audit.listeners;

import buildingblocks.contracts.flight.FlightCreated;
import buildingblocks.rabbitmq.MessageHandler;
import buildingblocks.utils.jsonconverter.JsonConverterUtils;
import io.bookingmicroservices.audit.data.mongo.documents.AuditLogDocument;
import io.bookingmicroservices.audit.data.mongo.repositories.AuditLogRepository;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class FlightCreatedListener implements MessageHandler<FlightCreated> {

    private final Logger logger;
    private final AuditLogRepository auditLogRepository;

    public FlightCreatedListener(Logger logger, AuditLogRepository auditLogRepository) {
        this.logger = logger;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void onMessage(FlightCreated event) {
        logger.info("Audit Log: Received FlightCreated event for flight ID: {}", event.Id());

        AuditLogDocument auditLog = AuditLogDocument.builder()
                .id(UUID.randomUUID().toString())
                .eventId(event.getEventId())
                .eventType(event.getEventType())
                .payload(JsonConverterUtils.serializeObject(event))
                .occurredOn(event.getOccurredOn())
                .build();

        auditLogRepository.save(auditLog);
        logger.info("Audit Log: Successfully persisted FlightCreated event with ID: {}", event.getEventId());
    }
}
