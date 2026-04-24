'use client';

import { useState, useEffect } from 'react';
import { RoomCard } from '@/components/sublease/room-card';
import { SearchBar } from '@/components/layout/search-bar';
import { RoomListItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function FindSubleasesPage() {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const filtered = rooms.filter(room =>
      room.propertyName.toLowerCase().includes(query.toLowerCase()) ||
      room.city.toLowerCase().includes(query.toLowerCase()) ||
      room.state.toLowerCase().includes(query.toLowerCase()) ||
      room.address.toLowerCase().includes(query.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(query.toLowerCase())) ||
      room.subleasorName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredRooms(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Subleases</h1>
          <p className="text-gray-600">
            Browse and search for available rooms and apartments for your internship stay.
          </p>
        </div>

        <div className="mb-8">
          <SearchBar
            placeholder="Search by location, price, or description..."
            onSearch={handleSearch}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={loadRooms}
              className="text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No subleases found matching your search.' : 'No subleases available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.roomID} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
