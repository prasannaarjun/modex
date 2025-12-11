import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { socket } from '../api/socket';
import { useBooking } from '../contexts/BookingContext';
import toast from 'react-hot-toast';
import { SeatGrid } from '../components/SeatGrid';
import { useCountdown } from '../hooks/useCountdown';
import { format } from 'date-fns';
import { SeatStatus } from '../api/types';
import type { Show, Seat } from '../api/types';

export const Booking = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { activeBookingId, setActiveBookingId, bookingExpiry, setBookingExpiry, resetBooking } = useBooking();

    const [show, setShow] = useState<Show | null>(null);
    const [loading, setLoading] = useState(true);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);
    const [countSelection, setCountSelection] = useState(1);

    // Poll interval ref
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchShowDetails = async () => {
        try {
            const res = await api.get(`/api/shows/${id}`);
            const data: Show = res.data;

            if (data.seats) {
                setSeats(data.seats);
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

        fetchShowDetails();

        const room = `show:${id}`;
        socket.emit('join', room);

        const handleSeatReserved = (data: { seat_ids: number[] }) => {
            updateSeatStatus(data.seat_ids, SeatStatus.LOCKED); // Maps to reserved visually usually
        };
        const handleSeatConfirmed = (data: { seat_ids: number[] }) => {
            updateSeatStatus(data.seat_ids, SeatStatus.BOOKED);
        };
        const handleSeatReleased = (data: { seat_ids: number[] }) => {
            updateSeatStatus(data.seat_ids, SeatStatus.AVAILABLE);
        };

        socket.on('seat_reserved', handleSeatReserved);
        socket.on('seat_confirmed', handleSeatConfirmed);
        socket.on('seat_released', handleSeatReleased);

        pollRef.current = setInterval(fetchShowDetails, 5000);

        return () => {
            socket.off('seat_reserved', handleSeatReserved);
            socket.off('seat_confirmed', handleSeatConfirmed);
            socket.off('seat_released', handleSeatReleased);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [id]);

    const updateSeatStatus = (ids: number[], status: SeatStatus) => {
        setSeats(prev => prev.map(s => ids.includes(s.id) ? { ...s, status } : s));
    };

    const handleSeatToggle = (seatId: number) => {
        if (selectedSeatIds.includes(seatId)) {
            setSelectedSeatIds(prev => prev.filter(id => id !== seatId));
        } else {
            setSelectedSeatIds(prev => [...prev, seatId]);
        }
    };

    const calculateTotal = () => {
        if (!show?.seats) return 0; // Fallback or handle separately
        return seats
            .filter(s => selectedSeatIds.includes(s.id))
            .reduce((sum, s) => sum + s.price, 0);
    };

    const handleBook = async () => {
        setProcessing(true);
        try {
            const payload = show?.seats && show.seats.length > 0
                ? { seatIds: selectedSeatIds }
                : { count: countSelection };

            const res = await api.post(`/api/shows/${id}/book`, payload);

            const { id: booking_id, expires_at } = res.data;

            if (!booking_id) throw new Error("No booking ID returned");

            setActiveBookingId(booking_id);
            setBookingExpiry(expires_at || null);
            toast.success('Seats reserved! Please confirm.');
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error('Some seats are no longer available. Refreshing...');
                fetchShowDetails();
                setSelectedSeatIds([]);
            } else {
                toast.error('Booking failed: ' + (err.response?.data?.error || err.response?.data?.message || 'Unknown error'));
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

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!show) return <div className="p-8 text-center text-red-500">Show not found</div>;

    if (activeBookingId) {
        return (
            <div className="max-w-xl mx-auto bg-white p-8 rounded shadow text-center mt-10">
                <h2 className="text-2xl font-bold mb-4 text-orange-600">Complete Your Booking</h2>
                <div className="mb-6 text-4xl font-mono font-bold text-gray-800">{timeLeft}</div>
                <p className="mb-6 text-gray-600">Please confirm your booking before the timer expires.</p>
                <button
                    onClick={handleConfirm}
                    disabled={processing || (minutes === 0 && seconds === 0)}
                    className="bg-green-600 text-white text-lg px-8 py-3 rounded hover:bg-green-700 disabled:opacity-50 w-full mb-4"
                >
                    {processing ? 'Confirming...' : (minutes === 0 && seconds === 0) ? 'Expired' : 'Confirm Booking'}
                </button>
                {(minutes === 0 && seconds === 0) && (
                    <button onClick={() => resetBooking()} className="text-blue-500 underline">Start Over</button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">{show.title}</h1>
                <p className="text-gray-600">{format(new Date(show.start_time), 'PPpp')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
                {seats && seats.length > 0 ? (
                    <>
                        <h3 className="text-lg font-bold mb-6 text-center border-b pb-4">Select Your Seats</h3>
                        <SeatGrid
                            seats={seats}
                            selectedSeats={selectedSeatIds}
                            onToggleSeat={handleSeatToggle}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-gray-700 font-medium">Selected: <span className="font-bold">{selectedSeatIds.length}</span></p>
                                <p className="text-gray-900 text-xl font-bold">Total: ₹{calculateTotal()}</p>
                            </div>
                            <button
                                onClick={handleBook}
                                disabled={selectedSeatIds.length === 0 || processing}
                                className="mt-4 sm:mt-0 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold shadow transition-colors"
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
