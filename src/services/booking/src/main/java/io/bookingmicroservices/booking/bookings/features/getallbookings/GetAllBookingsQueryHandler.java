package io.bookingmicroservices.booking.bookings.features.getallbookings;

import buildingblocks.mediator.abstractions.queries.IQueryHandler;
import io.bookingmicroservices.booking.data.mongo.repositories.BookingReadRepository;
import io.bookingmicroservices.booking.bookings.dtos.BookingDto;
import io.bookingmicroservices.booking.bookings.features.Mappings;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetAllBookingsQueryHandler implements IQueryHandler<GetAllBookingsQuery, List<BookingDto>> {
    private final BookingReadRepository bookingReadRepository;

    public GetAllBookingsQueryHandler(BookingReadRepository bookingReadRepository) {
        this.bookingReadRepository = bookingReadRepository;
    }

    @Override
    public List<BookingDto> handle(GetAllBookingsQuery query) {
        return bookingReadRepository.findAll().stream()
                .filter(booking -> !booking.isDeleted())
                .map(Mappings::toBookingDto)
                .toList();
    }
}
