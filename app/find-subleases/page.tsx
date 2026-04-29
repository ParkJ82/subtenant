'use client';

import { useState, useEffect } from 'react';
import { RoomCard } from '@/components/sublease/room-card';
import { SearchBar } from '@/components/layout/search-bar';
import { RoomFilterDialog } from '@/components/sublease/room-filter-dialog';
import { RoomListItem, RoomFilters } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function FindSubleasesPage() {
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<RoomFilters>({});
  // roomID → application status, populated only when logged in
  const [appStatusMap, setAppStatusMap] = useState<Map<number, 'pending' | 'accepted' | 'rejected'>>(new Map());

  useEffect(() => {
    loadRooms();
  }, [activeFilters]);

  // Fetch the user's sent applications once when auth state settles
  useEffect(() => {
    if (!user || !token) return;
    fetch('/api/applications?type=sent', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((apps: { roomID: number; status: 'pending' | 'accepted' | 'rejected' }[]) => {
        const map = new Map<number, 'pending' | 'accepted' | 'rejected'>();
        apps.forEach((a) => map.set(a.roomID, a.status));
        setAppStatusMap(map);
      })
      .catch(() => {});
  }, [user, token]);

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/rooms', window.location.origin);
      
      // Add active filters to URL
      if (activeFilters.location) url.searchParams.append('location', activeFilters.location);
      if (activeFilters.minPrice !== undefined) url.searchParams.append('minPrice', activeFilters.minPrice.toString());
      if (activeFilters.maxPrice !== undefined) url.searchParams.append('maxPrice', activeFilters.maxPrice.toString());
      if (activeFilters.availableFrom) url.searchParams.append('availableFrom', activeFilters.availableFrom);
      if (activeFilters.availableTo) url.searchParams.append('availableTo', activeFilters.availableTo);
      if (activeFilters.propertyType) url.searchParams.append('propertyType', activeFilters.propertyType);
      if (activeFilters.amenityIDs) {
        activeFilters.amenityIDs.forEach(id => url.searchParams.append('amenityIDs', id.toString()));
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
      applySearchAndFilters(data, searchQuery);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applySearchAndFilters = (roomsData: RoomListItem[], query: string) => {
    if (!query.trim()) {
      setFilteredRooms(roomsData);
      return;
    }

    const filtered = roomsData.filter(room =>
      room.propertyName.toLowerCase().includes(query.toLowerCase()) ||
      room.city.toLowerCase().includes(query.toLowerCase()) ||
      room.state.toLowerCase().includes(query.toLowerCase()) ||
      room.address.toLowerCase().includes(query.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(query.toLowerCase())) ||
      room.subleasorName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredRooms(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applySearchAndFilters(rooms, query);
  };

  const handleFilterClick = () => {
    setFilterOpen(true);
  };

  const handleApplyFilters = (filters: RoomFilters) => {
    setActiveFilters(filters);
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
            onFilterClick={handleFilterClick}
            showFilterButton={true}
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
              <RoomCard
                key={room.roomID}
                room={room}
                isOwnListing={!!user && room.subleasorEmail === user.email}
                applicationStatus={appStatusMap.get(room.roomID)}
              />
            ))}
          </div>
        )}
      </div>

      <RoomFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
}
