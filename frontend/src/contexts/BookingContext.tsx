import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// This context tracks the *current* booking flow state
interface BookingContextType {
    activeBookingId: number | null;
    setActiveBookingId: (id: number | null) => void;
    bookingExpiry: string | null;
    setBookingExpiry: (expiry: string | null) => void;
    resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
    const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
    const [bookingExpiry, setBookingExpiry] = useState<string | null>(null);

    const resetBooking = () => {
        setActiveBookingId(null);
        setBookingExpiry(null);
    };

    return (
        <BookingContext.Provider value={{ activeBookingId, setActiveBookingId, bookingExpiry, setBookingExpiry, resetBooking }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
};
