package io.bookingmicroservices.audit.listeners;

import buildingblocks.contracts.booking.BookingCreated;
import buildingblocks.rabbitmq.MessageHandler;
import buildingblocks.utils.jsonconverter.JsonConverterUtils;
import io.bookingmicroservices.audit.data.mongo.documents.AuditLogDocument;
import io.bookingmicroservices.audit.data.mongo.repositories.AuditLogRepository;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class BookingCreatedListener implements MessageHandler<BookingCreated> {

    private final Logger logger;
    private final AuditLogRepository auditLogRepository;

    public BookingCreatedListener(Logger logger, AuditLogRepository auditLogRepository) {
        this.logger = logger;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void onMessage(BookingCreated event) {
        logger.info("Audit Log: Received BookingCreated event for passenger name: {}", event.PassengerName());

        AuditLogDocument auditLog = AuditLogDocument.builder()
                .id(UUID.randomUUID().toString())
                .eventId(event.getEventId())
                .eventType(event.getEventType())
                .payload(JsonConverterUtils.serializeObject(event))
                .occurredOn(event.getOccurredOn())
                .build();

        auditLogRepository.save(auditLog);
        logger.info("Audit Log: Successfully persisted BookingCreated event with ID: {}", event.getEventId());
    }
}
