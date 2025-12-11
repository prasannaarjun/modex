import { clsx } from 'clsx';
import type { FC } from 'react';
import { SeatType, SeatStatus } from '../api/types';
import type { Seat } from '../api/types';

interface SeatGridProps {
    seats: Seat[];
    selectedSeats: number[];
    onToggleSeat: (seatId: number) => void;
}

export const SeatGrid: FC<SeatGridProps> = ({ seats, selectedSeats, onToggleSeat }) => {
    // Calculate grid size
    const gridSize = Math.ceil(Math.sqrt(seats.length));

    // Sort seats by row then column for proper grid ordering
    const sortedSeats = [...seats].sort((a, b) => {
        const rowA = parseInt(a.row);
        const rowB = parseInt(b.row);
        if (rowA !== rowB) return rowA - rowB;
        return a.number - b.number;
    });

    // Get unique prices for legend
    const uniquePrices = Array.from(new Set(seats.map(s => s.price))).sort((a, b) => a - b);

    const getSeatColor = (type: SeatType, status: SeatStatus, isSelected: boolean) => {
        if (status === SeatStatus.BOOKED || status === SeatStatus.LOCKED) return "bg-gray-500 border-gray-600 text-white cursor-not-allowed";
        if (isSelected) return "bg-green-500 border-green-600 text-white shadow-md scale-105 ring-2 ring-green-300";

        switch (type) {
            case SeatType.REGULAR:
                return "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-400";
            case SeatType.PREMIUM:
                return "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-400";
            case SeatType.VIP:
                return "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400";
            default:
                return "bg-gray-100 border-gray-200";
        }
    };

    return (
        <div className="flex flex-col items-center w-full overflow-x-auto">
            {/* Screen Visual */}
            <div className="w-full max-w-3xl mb-8">
                <div className="h-2 w-full bg-gray-300 rounded-lg mb-2 shadow-inner"></div>
                <div className="text-center text-xs text-gray-400 font-bold tracking-widest uppercase">Screen</div>
            </div>

            {/* Seat Grid */}
            <div
                className="grid gap-2 p-4"
                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
                {sortedSeats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    const isBooked = seat.status !== SeatStatus.AVAILABLE;

                    return (
                        <button
                            key={seat.id}
                            onClick={() => !isBooked && onToggleSeat(seat.id)}
                            disabled={isBooked}
                            className={clsx(
                                "w-10 h-10 rounded flex items-center justify-center text-xs font-bold transition-all duration-200 border-2",
                                getSeatColor(seat.type, seat.status, isSelected)
                            )}
                            title={`Row ${seat.row}, Seat ${seat.number} - ₹${seat.price}`}
                        >
                            {seat.number}
                        </button>
                    );
                })}
            </div>

            {/* Dynamic Legend */}
            <div className="mt-8 flex gap-6 text-sm flex-wrap justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-200 bg-blue-50 rounded"></div>
                    <span>Tier 1 (₹{uniquePrices[0] || '—'})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-200 bg-purple-50 rounded"></div>
                    <span>Tier 2 (₹{uniquePrices[1] || '—'})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-yellow-200 bg-yellow-50 rounded"></div>
                    <span>Tier 3 (₹{uniquePrices[2] || '—'})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-gray-600 bg-gray-500 rounded"></div>
                    <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-green-600 bg-green-500 rounded"></div>
                    <span>Selected</span>
                </div>
            </div>
        </div>
    );
};
