import { clsx } from 'clsx';
import type { FC } from 'react';

interface Seat {
    id: number;
    status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED' | 'LOCKED'; // LOCKED might be local temporary
}

interface SeatGridProps {
    seats: Seat[];
    selectedSeats: number[];
    onToggleSeat: (seatId: number) => void;
    maxSelectable?: number;
}

export const SeatGrid: FC<SeatGridProps> = ({ seats, selectedSeats, onToggleSeat }) => {
    // Simple grid layout logic: we simply list them. 
    // If we had row/col info we'd use it. We'll simulate a 10-column grid.

    return (
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 mb-6">
            {seats.map(seat => {
                const isSelected = selectedSeats.includes(seat.id);
                const isAvailable = seat.status === 'AVAILABLE';

                // Define base styles
                const baseClass = clsx(
                    "w-8 h-8 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-bold transition-all transform duration-200 cursor-pointer border border-opacity-50",
                    {
                        // Available
                        "bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:scale-105 shadow-sm": isAvailable && !isSelected,

                        // Selected (by me)
                        "bg-green-500 border-green-600 text-white hover:bg-green-600 shadow-md scale-105 ring-2 ring-green-300": isSelected,

                        // Reserved (by others, pending)
                        "bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-80": seat.status === 'RESERVED' && !isSelected,

                        // Confirmed (Sold)
                        "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed": seat.status === 'CONFIRMED'
                    }
                );

                return (
                    <div
                        key={seat.id}
                        onClick={() => isAvailable && onToggleSeat(seat.id)}
                        className={baseClass}
                        title={`Seat ${seat.id} (${seat.status})`}
                    >
                        {seat.id}
                    </div>
                );
            })}
        </div>
    );
};
