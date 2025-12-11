import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface BookingWithShow {
    id: number;
    show_id: number;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
    created_at: string;
    show?: {
        id: number;
        title: string;
        start_time: string;
    };
}

export const MyBookings = () => {
    const [bookings, setBookings] = useState<BookingWithShow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/api/bookings');
                setBookings(res.data);
            } catch (err) {
                toast.error('Failed to load bookings');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'EXPIRED': return 'bg-red-100 text-red-800';
            case 'FAILED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

            {bookings.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    <p>You haven't made any bookings yet.</p>
                    <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">
                        Browse Shows
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">{booking.show?.title || 'Unknown Show'}</h3>
                                {booking.show && (
                                    <p className="text-gray-500 text-sm">
                                        {format(new Date(booking.show.start_time), 'PPpp')}
                                    </p>
                                )}
                                <p className="text-gray-400 text-xs mt-1">
                                    Booked: {format(new Date(booking.created_at), 'PPpp')}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                                <Link to={`/bookings/${booking.id}`} className="text-blue-600 hover:underline text-sm">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
