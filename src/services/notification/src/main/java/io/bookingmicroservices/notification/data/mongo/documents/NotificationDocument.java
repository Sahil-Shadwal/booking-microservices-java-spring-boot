package io.bookingmicroservices.notification.data.mongo.documents;

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
@Document(collection = "notifications")
public class NotificationDocument {
    @Id
    private String id;
    private UUID bookingId;
    private String passengerName;
    private String flightNumber;
    private String seatNumber;
    private String message;
    private String status;
    private LocalDateTime createdAt;
}
