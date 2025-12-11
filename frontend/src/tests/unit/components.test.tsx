import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShowCard } from '../../components/ShowCard';
import { BrowserRouter } from 'react-router-dom';
import type { Show } from '../../api/types';

describe('ShowCard', () => {
    const mockShow: Show = {
        id: 1,
        title: 'Interstellar',
        start_time: '2025-12-12T18:00:00Z',
        total_seats: 100
    };

    test('renders show title and details', () => {
        render(
            <BrowserRouter>
                <ShowCard show={mockShow} />
            </BrowserRouter>
        );

        expect(screen.getByText('Interstellar')).toBeInTheDocument();
        expect(screen.getByText(/Capacity:/)).toBeInTheDocument();
        expect(screen.getByText('100 seats')).toBeInTheDocument();
        expect(screen.getByText(/Book Now/)).toBeInTheDocument();
    });
});
