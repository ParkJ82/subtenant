'use client';

import { RoomListItem } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Building } from 'lucide-react';
import Link from 'next/link';

interface RoomCardProps {
  room: RoomListItem;
  isOwnListing?: boolean;
  applicationStatus?: 'pending' | 'accepted' | 'rejected';
}

export function RoomCard({ room, isOwnListing, applicationStatus }: RoomCardProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
        </div>

        <CardContent className="p-4 space-y-3">
          {(isOwnListing || applicationStatus) && (
            <div className="flex flex-wrap gap-1">
              {isOwnListing && (
                <Badge className="bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-100">
                  Your Listing
                </Badge>
              )}
              {!isOwnListing && applicationStatus === 'pending' && (
                <Badge className="bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-100">
                  Applied
                </Badge>
              )}
              {!isOwnListing && applicationStatus === 'accepted' && (
                <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">
                  Accepted
                </Badge>
              )}
              {!isOwnListing && applicationStatus === 'rejected' && (
                <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">
                  Rejected
                </Badge>
              )}
            </div>
          )}

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
