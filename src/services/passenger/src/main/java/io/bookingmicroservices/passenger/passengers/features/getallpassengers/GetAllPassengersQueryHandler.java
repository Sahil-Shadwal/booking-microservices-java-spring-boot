package io.bookingmicroservices.passenger.passengers.features.getallpassengers;

import buildingblocks.mediator.abstractions.queries.IQueryHandler;
import io.bookingmicroservices.passenger.data.mongo.repositories.PassengerReadRepository;
import io.bookingmicroservices.passenger.passengers.dtos.PassengerDto;
import io.bookingmicroservices.passenger.passengers.features.Mappings;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetAllPassengersQueryHandler implements IQueryHandler<GetAllPassengersQuery, List<PassengerDto>> {
    private final PassengerReadRepository passengerReadRepository;

    public GetAllPassengersQueryHandler(PassengerReadRepository passengerReadRepository) {
        this.passengerReadRepository = passengerReadRepository;
    }

    @Override
    public List<PassengerDto> handle(GetAllPassengersQuery query) {
        return passengerReadRepository.findAll().stream()
                .filter(passenger -> !passenger.isDeleted())
                .map(Mappings::toPassengerDto)
                .toList();
    }
}
