import { useState } from 'react';
import { api } from '../api/client';
import { useShows } from '../contexts/ShowsContext';
import type { OnboardRequest, CreateShowRequest } from '../api/types';
import toast from 'react-hot-toast';

export const Admin = () => {
    const [activeTab, setActiveTab] = useState<'shows' | 'theater'>('shows');

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

            <div className="flex border-b mb-6">
                <button
                    className={`py-2 px-4 font-semibold ${activeTab === 'shows' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('shows')}
                >
                    Manage Shows
                </button>
                <button
                    className={`py-2 px-4 font-semibold ${activeTab === 'theater' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('theater')}
                >
                    Theater Setup
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                {activeTab === 'shows' ? <CreateShowForm /> : <OnboardTheaterForm />}
            </div>
        </div>
    );
};

const CreateShowForm = () => {
    const { refreshShows } = useShows();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<CreateShowRequest>>({
        title: '',
        start_time: '',
        total_seats: 100
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.start_time || !formData.total_seats) return;

        setLoading(true);
        try {
            // Ensure date is ISO string format if needed, input type="datetime-local" returns slightly different format sometimes
            // "YYYY-MM-DDTHH:mm" is usually compatible if passed as string, but standard is ISO.
            // But let's send it as is or new Date(..).toISOString();
            const payload = {
                ...formData,
                start_time: new Date(formData.start_time).toISOString(),
                total_seats: Number(formData.total_seats)
            };

            await api.post('/api/shows', payload);
            toast.success('Show created successfully!');
            setFormData({ title: '', start_time: '', total_seats: 100 });
            await refreshShows();
        } catch (err: any) {
            toast.error('Failed to create show: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Create New Show</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Show Title</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                        type="datetime-local"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        value={formData.start_time}
                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Seats</label>
                    <input
                        type="number"
                        required
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        value={formData.total_seats}
                        onChange={e => setFormData({ ...formData, total_seats: Number(e.target.value) })}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? 'Creating...' : 'Create Show'}
                </button>
            </form>
        </div>
    );
};

const OnboardTheaterForm = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<OnboardRequest>({
        name: '', street: '', area: '', city: '', state: '', country: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/admin/onboard', formData);
            toast.success('Theater onboarded successfully!');
        } catch (err: any) {
            if (err.response?.status === 409) {
                toast.error('Theater already onboarded.');
            } else {
                toast.error('Failed: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Onboard Theater Details</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Theater Name</label>
                    <input name="name" required value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Street</label>
                    <input name="street" required value={formData.street} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Area</label>
                    <input name="area" required value={formData.area} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input name="city" required value={formData.city} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input name="state" required value={formData.state} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input name="country" required value={formData.country} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>
                <div className="md:col-span-2 mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Theater Details'}
                    </button>
                </div>
            </form>
        </div>
    );
};
