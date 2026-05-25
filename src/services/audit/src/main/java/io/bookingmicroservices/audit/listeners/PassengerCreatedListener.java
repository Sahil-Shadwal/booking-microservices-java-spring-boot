package io.bookingmicroservices.audit.listeners;

import buildingblocks.contracts.passenger.PassengerCreated;
import buildingblocks.rabbitmq.MessageHandler;
import buildingblocks.utils.jsonconverter.JsonConverterUtils;
import io.bookingmicroservices.audit.data.mongo.documents.AuditLogDocument;
import io.bookingmicroservices.audit.data.mongo.repositories.AuditLogRepository;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class PassengerCreatedListener implements MessageHandler<PassengerCreated> {

    private final Logger logger;
    private final AuditLogRepository auditLogRepository;

    public PassengerCreatedListener(Logger logger, AuditLogRepository auditLogRepository) {
        this.logger = logger;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void onMessage(PassengerCreated event) {
        logger.info("Audit Log: Received PassengerCreated event for passenger: {}", event.Name());

        AuditLogDocument auditLog = AuditLogDocument.builder()
                .id(UUID.randomUUID().toString())
                .eventId(event.getEventId())
                .eventType(event.getEventType())
                .payload(JsonConverterUtils.serializeObject(event))
                .occurredOn(event.getOccurredOn())
                .build();

        auditLogRepository.save(auditLog);
        logger.info("Audit Log: Successfully persisted PassengerCreated event with ID: {}", event.getEventId());
    }
}
