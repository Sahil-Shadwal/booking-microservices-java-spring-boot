package io.bookingmicroservices.passenger.passengers.features.getallpassengers;

import buildingblocks.mediator.abstractions.queries.IQuery;
import io.bookingmicroservices.passenger.passengers.dtos.PassengerDto;
import java.util.List;

public record GetAllPassengersQuery() implements IQuery<List<PassengerDto>> {
}
