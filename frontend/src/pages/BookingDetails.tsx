import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { format } from 'date-fns';
import type { BookingDetailsResponse } from '../api/types';
import { clsx } from 'clsx';

export const BookingDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [booking, setBooking] = useState<BookingDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await api.get('/api/bookings/' + id);
                setBooking(res.data);
            } catch (err: any) {
                setError('Failed to load booking details.');
            } finally {
                setLoading(false);
            }
        };
        fetchBooking();
    }, [id]);

    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (error || !booking) return <div className="text-center p-10 text-red-500">{error || 'Booking not found'}</div>;

    return (
        <div className="max-w-xl mx-auto bg-white p-8 rounded shadow text-center mt-10">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Booking #{booking.id}</h1>

            <div className="mb-8">
                <span className={clsx(
                    "px-4 py-2 rounded-full text-sm font-bold",
                    {
                        'bg-green-100 text-green-800': booking.status === 'CONFIRMED',
                        'bg-yellow-100 text-yellow-800': booking.status === 'PENDING',
                        'bg-red-100 text-red-800': booking.status === 'FAILED',
                    }
                )}>
                    {booking.status}
                </span>
            </div>

            <div className="space-y-4 text-left border p-4 rounded bg-gray-50">
                <p><span className="font-bold">Seats:</span> {booking.seats ? booking.seats.join(', ') : 'N/A'}</p>
                <p><span className="font-bold">Expires At:</span> {booking.expires_at ? format(new Date(booking.expires_at), 'PPpp') : 'N/A'}</p>
                {/* Timestamps if available in response */}
            </div>

            <div className="mt-8">
                <Link to="/" className="text-blue-600 hover:underline">Back to Shows</Link>
            </div>
        </div>
    );
};
