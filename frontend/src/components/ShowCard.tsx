import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { Show } from '../api/types';

export const ShowCard = ({ show }: { show: Show }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col h-full border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" title={show.title}>{show.title}</h3>
            <div className="flex-grow">
                <p className="text-gray-600 mb-1 text-sm">
                    <span className="font-semibold">Start:</span> {format(new Date(show.start_time), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-gray-600 mb-4 text-sm">
                    <span className="font-semibold">Capacity:</span> {show.total_seats} seats
                </p>
            </div>
            <Link
                to={`/booking/${show.id}`}
                className="block text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium mt-auto"
            >
                Book Now
            </Link>
        </div>
    );
};
