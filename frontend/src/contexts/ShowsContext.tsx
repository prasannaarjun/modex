import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { Show, ShowListResponse } from '../api/types';

interface ShowsContextType {
    shows: Show[];
    loading: boolean;
    error: string | null;
    refreshShows: () => Promise<void>;
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

export const ShowsProvider = ({ children }: { children: ReactNode }) => {
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchShows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<ShowListResponse>('/api/shows');
            // Fix: if response.data is the array
            setShows(res.data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load shows');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShows();

        // Listen for global show updates if any?
        // Maybe 'show_created'? Admin might create show.
        // If not specified, we can at least refresh on mount.

        // Also we might want to listen to socket events to update availability on the list?
        // "Each show card shows ... available seats (compute from backend counts ...)"
        // If we want real-time availability on the list, we need to listen to all shows? That might be heavy.
        // I'll stick to Fetch on mount + manual refresh.
    }, [fetchShows]);

    return (
        <ShowsContext.Provider value={{ shows, loading, error, refreshShows: fetchShows }}>
            {children}
        </ShowsContext.Provider>
    );
};

export const useShows = () => {
    const context = useContext(ShowsContext);
    if (!context) {
        throw new Error('useShows must be used within a ShowsProvider');
    }
    return context;
};
