package io.bookingmicroservices.audit.data.mongo.documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "audit_logs")
public class AuditLogDocument {
    @Id
    private String id;
    private UUID eventId;
    private String eventType;
    private String payload;
    private LocalDateTime occurredOn;
}
