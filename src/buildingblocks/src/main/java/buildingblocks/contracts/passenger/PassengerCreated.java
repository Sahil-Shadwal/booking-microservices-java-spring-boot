package buildingblocks.contracts.passenger;

import buildingblocks.core.event.IntegrationEvent;
import java.util.UUID;

public record PassengerCreated(
    UUID Id,
    String Name,
    String PassportNumber,
    int PassengerType,
    int Age
) implements IntegrationEvent {
}
