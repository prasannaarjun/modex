import { BookingService } from '../../src/services/booking.service';
import { BookingRepository } from '../../src/repositories/booking.repository';
import * as QueueService from '../../src/services/queue.service';
import { BookingStatus } from '../../src/types';

// Mocks
jest.mock('../../src/repositories/booking.repository');
jest.mock('../../src/services/queue.service');

describe('BookingService Unit Tests', () => {
    let bookingService: BookingService;
    let mockCreateBooking: jest.Mock;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Setup service
        bookingService = new BookingService();

        // Get mock reference
        mockCreateBooking = (BookingRepository.prototype.createBooking as jest.Mock);
    });

    it('should create a booking and schedule expiry job', async () => {
        // Arrange
        const mockBooking = {
            id: 1,
            show_id: 100,
            status: BookingStatus.PENDING,
            expires_at: new Date(),
            created_at: new Date()
        };
        mockCreateBooking.mockResolvedValue(mockBooking);

        // Act
        const result = await bookingService.createBooking(100);

        // Assert
        expect(mockCreateBooking).toHaveBeenCalledWith(100);
        expect(QueueService.addExpiryJob).toHaveBeenCalledWith(1, 120000); // 2 mins in ms
        expect(result).toEqual(mockBooking);
    });

    it('should propagate errors from repository', async () => {
        // Arrange
        const error = new Error('No seats available');
        mockCreateBooking.mockRejectedValue(error);

        // Act & Assert
        await expect(bookingService.createBooking(100)).rejects.toThrow('No seats available');
        expect(QueueService.addExpiryJob).not.toHaveBeenCalled();
    });
});
