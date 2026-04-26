'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RoomWithDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ArrowLeft, Loader2, ChevronDown, ChevronUp, Building, Home } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SubleaseInfoPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const [room, setRoom] = useState<RoomWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  // undefined = not yet fetched, null = no application
  const [existingStatus, setExistingStatus] = useState<'pending' | 'accepted' | 'rejected' | null | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [params.id]);

  // true as soon as both room and user are loaded and IDs match
  const isOwnListing = !!user && !!room && room.subleasor.accountID === user.accountID;

  // Check for an existing application whenever auth state or room changes
  useEffect(() => {
    if (!isAuthenticated || !room) {
      if (!isAuthenticated) setExistingStatus(null);
      return;
    }
    // Own listing — skip the application check entirely
    if (user && room.subleasor.accountID === user.accountID) return;
    const checkExisting = async () => {
      try {
        const res = await fetch(
          `/api/applications?type=check&roomID=${room.roomID}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setExistingStatus(data ? data.status : null);
        }
      } catch {
        setExistingStatus(null);
      }
    };
    checkExisting();
  }, [isAuthenticated, room, user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rooms/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch room');
      const data = await response.json();
      setRoom(data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load room information.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!room) return;

    setApplying(true);
    setApplyError(null);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ roomID: room.roomID }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit application');
      }

      setExistingStatus('pending');
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const nextImage = () => {
    if (room && room.photos.length > 0) {
      setCurrentImageIndex((currentImageIndex + 1) % room.photos.length);
    }
  };

  const prevImage = () => {
    if (room && room.photos.length > 0) {
      setCurrentImageIndex(
        currentImageIndex === 0 ? room.photos.length - 1 : currentImageIndex - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{error || 'Sublease not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const description = room.description || '';
  const shouldTruncate = description.length > 200;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="relative h-64 md:h-96 bg-gray-100">
                {room.photos.length > 0 ? (
                  <>
                    <img
                      src={room.photos[currentImageIndex].photoUrl}
                      alt={room.suite.property.propertyName}
                      className="w-full h-full object-cover"
                    />
                    {room.photos.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90"
                          onClick={prevImage}
                        >
                          <ChevronUp className="w-5 h-5 -rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90"
                          onClick={nextImage}
                        >
                          <ChevronDown className="w-5 h-5 rotate-90" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {room.photos.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No images available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{room.suite.property.propertyName}</CardTitle>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{room.suite.property.address}, {room.suite.property.city}, {room.suite.property.state}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ${room.monthlyRent}
                    <span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 justify-end mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {formatDate(room.availableFrom)} - {formatDate(room.availableTo)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Property Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{room.suite.property.propertyType}</span>
                  </div>
                  {room.suite.property.yearBuilt && (
                    <div className="flex items-center text-gray-600">
                      <span>Built: {room.suite.property.yearBuilt}</span>
                    </div>
                  )}
                  {room.suite.suiteNumber && (
                    <div className="flex items-center text-gray-600">
                      <span>Suite: {room.suite.suiteNumber}</span>
                    </div>
                  )}
                  {room.suite.floor && (
                    <div className="flex items-center text-gray-600">
                      <span>Floor: {room.suite.floor}</span>
                    </div>
                  )}
                  {room.suite.totalRooms && (
                    <div className="flex items-center text-gray-600">
                      <Home className="w-4 h-4 mr-2" />
                      <span>{room.suite.totalRooms} rooms</span>
                    </div>
                  )}
                  {room.suite.totalBathrooms && (
                    <div className="flex items-center text-gray-600">
                      <span>{room.suite.totalBathrooms} bathrooms</span>
                    </div>
                  )}
                </div>
              </div>

              {room.suite.property.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Property Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {room.suite.property.description}
                  </p>
                </div>
              )}

              {room.suite.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Suite Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {room.suite.description}
                  </p>
                </div>
              )}

              {description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Room Description</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {showFullDescription || !shouldTruncate
                      ? description
                      : `${description.slice(0, 200)}...`}
                    {shouldTruncate && (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                      >
                        {showFullDescription ? 'Show less' : 'Read more'}
                      </Button>
                    )}
                  </p>
                </div>
              )}

              {room.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity) => (
                      <Badge key={amenity.amenityID} variant="secondary">
                        {amenity.amenityName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Listed By</h3>
                <Badge variant="secondary">{room.subleasor.account.name}</Badge>
              </div>

              {applyError && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{applyError}</p>
              )}
              {existingStatus === 'pending' && (
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
                  Your application is pending. The subleasor will be in touch.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                {isOwnListing ? (
                  <Button
                    className="flex-1 cursor-not-allowed opacity-60"
                    disabled
                    variant="outline"
                  >
                    Your Listing
                  </Button>
                ) : (
                  <>
                    {existingStatus === 'pending' && (
                      <Button className="flex-1" disabled>
                        Application Pending
                      </Button>
                    )}
                    {existingStatus === 'accepted' && (
                      <Button className="flex-1" disabled>
                        Application Accepted
                      </Button>
                    )}
                    {existingStatus === 'rejected' && (
                      <Button className="flex-1" variant="outline" disabled>
                        Application Rejected
                      </Button>
                    )}
                    {(existingStatus === null || existingStatus === undefined) && (
                      <Button
                        onClick={handleApply}
                        className="flex-1"
                        disabled={applying || existingStatus === undefined}
                      >
                        {applying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Apply for Room'
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
