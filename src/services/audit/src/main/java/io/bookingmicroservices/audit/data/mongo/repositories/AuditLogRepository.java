package io.bookingmicroservices.audit.data.mongo.repositories;

import io.bookingmicroservices.audit.data.mongo.documents.AuditLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLogDocument, String> {
    List<AuditLogDocument> findAllByEventTypeIgnoreCase(String eventType);
}
