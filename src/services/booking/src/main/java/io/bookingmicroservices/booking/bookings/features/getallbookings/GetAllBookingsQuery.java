package io.bookingmicroservices.booking.bookings.features.getallbookings;

import buildingblocks.mediator.abstractions.queries.IQuery;
import io.bookingmicroservices.booking.bookings.dtos.BookingDto;
import java.util.List;

public record GetAllBookingsQuery() implements IQuery<List<BookingDto>> {
}
