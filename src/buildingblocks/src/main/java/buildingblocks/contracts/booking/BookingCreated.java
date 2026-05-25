package buildingblocks.contracts.booking;

import buildingblocks.core.event.IntegrationEvent;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record BookingCreated(
    UUID Id,
    String PassengerName,
    String FlightNumber,
    String SeatNumber,
    String Description,
    LocalDateTime FlightDate,
    BigDecimal Price
) implements IntegrationEvent {
}

