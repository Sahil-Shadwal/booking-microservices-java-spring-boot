package io.bookingmicroservices.notification.data.mongo.repositories;

import io.bookingmicroservices.notification.data.mongo.documents.NotificationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationReadRepository extends MongoRepository<NotificationDocument, String> {
    List<NotificationDocument> findAllByPassengerNameIgnoreCase(String passengerName);
}
