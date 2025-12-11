import { useState, useEffect } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

export const useCountdown = (targetDate: string | null) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!targetDate) {
            setTimeLeft(0);
            return;
        }

        const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;

        const tick = () => {
            const now = new Date();
            const diff = differenceInSeconds(target, now);
            if (diff <= 0) {
                setTimeLeft(0);
            } else {
                setTimeLeft(diff);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return { timeLeft, minutes, seconds, format: `${minutes}:${seconds.toString().padStart(2, '0')}` };
};
