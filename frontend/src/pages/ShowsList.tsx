import { useEffect } from 'react';
import { useShows } from '../contexts/ShowsContext';
import { ShowCard } from '../components/ShowCard';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const ShowsList = () => {
    const { shows, loading, error, refreshShows } = useShows();
    const { user } = useAuth();

    useEffect(() => {
        refreshShows();
    }, [refreshShows]);

    if (loading) return <div className="text-center p-10 text-gray-500">Loading upcoming shows...</div>;
    if (error) return (
        <div className="text-center p-10">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={refreshShows} className="text-blue-500 underline">Try Again</button>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Upcoming Shows</h1>
                {user?.role === 'admin' && (
                    <Link to="/admin" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">
                        Manage Shows
                    </Link>
                )}
            </div>

            {shows.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-lg shadow text-gray-500">
                    No shows scheduled yet. Check back later!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {shows.map(show => <ShowCard key={show.id} show={show} />)}
                </div>
            )}
        </div>
    );
};
