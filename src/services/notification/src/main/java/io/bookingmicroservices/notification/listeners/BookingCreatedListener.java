package io.bookingmicroservices.notification.listeners;

import buildingblocks.contracts.booking.BookingCreated;
import buildingblocks.rabbitmq.MessageHandler;
import io.bookingmicroservices.notification.data.mongo.documents.NotificationDocument;
import io.bookingmicroservices.notification.data.mongo.repositories.NotificationReadRepository;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class BookingCreatedListener implements MessageHandler<BookingCreated> {

    private final Logger logger;
    private final NotificationReadRepository notificationRepository;

    public BookingCreatedListener(Logger logger, NotificationReadRepository notificationRepository) {
        this.logger = logger;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void onMessage(BookingCreated event) {
        logger.info("Received BookingCreated integration event for Booking ID: {}", event.Id());

        String messageContent = String.format(
            "Dear %s, your booking (ID: %s) for Flight %s (Seat: %s) has been successfully confirmed. Description: %s. Flight Date: %s. Price: $%s.",
            event.PassengerName(),
            event.Id(),
            event.FlightNumber(),
            event.SeatNumber(),
            event.Description(),
            event.FlightDate(),
            event.Price()
        );

        NotificationDocument notification = NotificationDocument.builder()
                .id(UUID.randomUUID().toString())
                .bookingId(event.Id())
                .passengerName(event.PassengerName())
                .flightNumber(event.FlightNumber())
                .seatNumber(event.SeatNumber())
                .message(messageContent)
                .status("SENT")
                .createdAt(LocalDateTime.now())
                .build();

        notificationRepository.save(notification);

        logger.info("Successfully sent and logged confirmation notification to passenger: {}", event.PassengerName());
    }
}
