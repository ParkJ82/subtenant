'use client';

import { RoomListItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Heart, Building } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface RoomCardProps {
  room: RoomListItem;
}

export function RoomCard({ room }: RoomCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <Link href={`/sublease/${room.roomID}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden h-full">
        <div className="relative h-48 bg-gray-100">
          {room.photos.length > 0 ? (
            <img
              src={room.photos[0].photoUrl}
              alt={room.propertyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
          <button
            onClick={toggleSave}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{room.propertyName}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
              <span className="line-clamp-1">
                {room.city}, {room.state}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">
              ${room.monthlyRent}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {formatDate(room.availableFrom)} - {formatDate(room.availableTo)}
            </span>
          </div>

          {room.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {room.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {room.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity.amenityID} variant="secondary" className="text-xs">
                {amenity.amenityName}
              </Badge>
            ))}
            {room.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{room.amenities.length - 3}
              </Badge>
            )}
          </div>

          <Badge variant="secondary" className="w-fit">
            {room.subleasorName}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
