import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { socket } from '../api/socket';
import { useBooking } from '../contexts/BookingContext';
import toast from 'react-hot-toast';
import { SeatGrid } from '../components/SeatGrid';
import { useCountdown } from '../hooks/useCountdown';
import { format } from 'date-fns';

interface Seat {
    id: number;
    status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED';
}

interface ShowDetail {
    id: number;
    title: string;
    start_time: string;
    total_seats: number;
    reserved_seats?: number;
    confirmed_seats?: number;
    seats?: Seat[]; // Optional seat map
}

export const Booking = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { activeBookingId, setActiveBookingId, bookingExpiry, setBookingExpiry, resetBooking } = useBooking();

    const [show, setShow] = useState<ShowDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [generatedSeats, setGeneratedSeats] = useState<Seat[]>([]);
    const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);
    const [countSelection, setCountSelection] = useState(1);

    // Poll interval ref
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchShowDetails = async () => {
        try {
            const res = await api.get(`/api/shows/${id}`);
            const data = res.data;

            // If seats are missing, mock them based on total_seats or available count
            if (!data.seats && data.total_seats) {
                // We mock a list of seats if not provided, assuming they are available unless we check availability endpoint?
                // Actually, if backend doesn't give seat map, we should use Numeric Selection.
                // But for "Visual seat grid when seat-level data exists", I will assume `seats` property presence switches mode.
                // However, to demonstrate the Seat Grid component even if backend is simple, I might synthesize it?
                // No, I'll stick to: No seats props -> Numeric UI.
                // BUT, I'll check if API returns partial seats?
                // For the purpose of this task, if the API returns just standard response without seats, I should fallback to Numeric.
                // Let's implement Numeric fallback.
            } else if (data.seats) {
                setGeneratedSeats(data.seats);
            }

            setShow(data);
        } catch (err) {
            toast.error('Failed to load show details');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        // Initial fetch
        fetchShowDetails();

        // Socket subscription
        const room = `show:${id}`;
        socket.emit('join', room); // Assuming backend supports custom 'join' event or similar

        const handleSeatReserved = (data: { seat_ids: number[] }) => {
            updateSeatStatus(data.seat_ids, 'RESERVED');
        };
        const handleSeatConfirmed = (data: { seat_ids: number[] }) => {
            updateSeatStatus(data.seat_ids, 'CONFIRMED');
        };
        const handleSeatReleased = (data: { seat_ids: number[] }) => {
            updateSeatStatus(data.seat_ids, 'AVAILABLE');
        };

        socket.on('seat_reserved', handleSeatReserved);
        socket.on('seat_confirmed', handleSeatConfirmed);
        socket.on('seat_released', handleSeatReleased);

        // Polling fallback (every 5s)
        pollRef.current = setInterval(fetchShowDetails, 5000);

        return () => {
            // socket.emit('leave', room); // Clean up if supported
            socket.off('seat_reserved', handleSeatReserved);
            socket.off('seat_confirmed', handleSeatConfirmed);
            socket.off('seat_released', handleSeatReleased);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [id]);

    const updateSeatStatus = (ids: number[], status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED') => {
        setGeneratedSeats(prev => prev.map(s => ids.includes(s.id) ? { ...s, status } : s));
    };

    const handleSeatToggle = (seatId: number) => {
        if (selectedSeatIds.includes(seatId)) {
            setSelectedSeatIds(prev => prev.filter(id => id !== seatId));
        } else {
            setSelectedSeatIds(prev => [...prev, seatId]);
        }
    };

    const handleBook = async () => {
        setProcessing(true);
        try {
            // payload construction (Assuming backend accepts { seat_ids } or { count })
            const payload = show?.seats
                ? { seat_ids: selectedSeatIds }
                : { count: countSelection };

            // Spec says /api/shows/{id}/book. POST.
            // Response 200 Booking PENDING. 
            // Assumption: Returns { booking_id, expires_at } in body (implied by requirements).

            const res = await api.post(`/api/shows/${id}/book`, payload);

            const { id: booking_id, expires_at } = res.data; // Map id to booking_id booking_id

            if (!booking_id) throw new Error("No booking ID returned");

            setActiveBookingId(booking_id);
            setBookingExpiry(expires_at || null);

            toast.success('Seats reserved! Please confirm.');
            // We can stay on page and show confirmation modal or overlay
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error('Some seats are no longer available. Refreshing...');
                fetchShowDetails();
                setSelectedSeatIds([]);
            } else {
                toast.error('Booking failed: ' + (err.response?.data?.message || 'Unknown error'));
            }
        } finally {
            setProcessing(false);
        }
    };

    const { minutes, seconds, format: timeLeft } = useCountdown(bookingExpiry);

    const handleConfirm = async () => {
        if (!activeBookingId) return;
        setProcessing(true);
        try {
            await api.post(`/api/bookings/${activeBookingId}/confirm`);
            resetBooking();
            toast.success('Booking Confirmed!');
            navigate(`/bookings/${activeBookingId}`);
        } catch (err: any) {
            toast.error('Confirmation failed: ' + (err.response?.data?.message || 'Unknown error'));
            if (err.response?.status === 409) {
                resetBooking(); // Expired
                fetchShowDetails();
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading booking details...</div>;
    if (!show) return <div className="p-8 text-center text-red-500">Show not found</div>;

    // Active Pending Booking Mode
    if (activeBookingId) {
        return (
            <div className="max-w-xl mx-auto bg-white p-8 rounded shadow text-center">
                <h2 className="text-2xl font-bold mb-4 text-orange-600">Complete Your Booking</h2>
                <div className="mb-6 text-4xl font-mono font-bold text-gray-800">
                    {timeLeft}
                </div>
                <p className="mb-6 text-gray-600">Please confirm your booking before the timer expires.</p>
                <button
                    onClick={handleConfirm}
                    disabled={processing || (minutes === 0 && seconds === 0)}
                    className="bg-green-600 text-white text-lg px-8 py-3 rounded hover:bg-green-700 disabled:opacity-50 w-full"
                >
                    {processing ? 'Confirming...' : (minutes === 0 && seconds === 0) ? 'Expired' : 'Confirm Booking'}
                </button>
                {(minutes === 0 && seconds === 0) && (
                    <button onClick={() => resetBooking()} className="mt-4 text-blue-500 underline">Start Over</button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">{show.title}</h1>
                <p className="text-gray-600">{format(new Date(show.start_time), 'PPpp')}</p>
            </div>

            {/* Seat Map or Numeric Selector */}
            <div className="bg-white p-6 rounded shadow mb-6">
                {show.seats && show.seats.length > 0 ? (
                    <>
                        <h3 className="text-lg font-bold mb-4">Select Seats</h3>
                        <SeatGrid
                            seats={generatedSeats}
                            selectedSeats={selectedSeatIds}
                            onToggleSeat={handleSeatToggle}
                        />
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-gray-700">Selected: {selectedSeatIds.length}</p>
                            <button
                                onClick={handleBook}
                                disabled={selectedSeatIds.length === 0 || processing}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Reserving...' : 'Book Selected Seats'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10">
                        <h3 className="text-lg font-bold mb-4">Select Number of Tickets</h3>
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <button
                                onClick={() => setCountSelection(Math.max(1, countSelection - 1))}
                                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-xl"
                            >-</button>
                            <span className="text-3xl font-bold w-12 text-center">{countSelection}</span>
                            <button
                                onClick={() => {
                                    const available = (show.total_seats || 0) - ((show.reserved_seats || 0) + (show.confirmed_seats || 0));
                                    setCountSelection(Math.min(available, countSelection + 1));
                                }}
                                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-xl"
                            >+</button>
                        </div>
                        <button
                            onClick={handleBook}
                            disabled={processing}
                            className="bg-blue-600 text-white px-8 py-3 rounded hover:bg-blue-700 disabled:opacity-50 text-lg"
                        >
                            {processing ? 'Reserving...' : 'Book Tickets'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
