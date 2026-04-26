'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TenantFormData, RoomFormData, Amenity } from '@/lib/types';
import { Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ExistingTenant {
  tenantID: number;
  companyName: string | null;
  availableFrom: string | null;
  availableTo: string | null;
  isListed: boolean;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenant' | 'room'>('tenant');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  // undefined = not yet fetched, null = no existing tenant
  const [existingTenant, setExistingTenant] = useState<ExistingTenant | null | undefined>(undefined);
  const [tenantEditing, setTenantEditing] = useState(false);
  const [tenantEditSaving, setTenantEditSaving] = useState(false);
  const [tenantEditError, setTenantEditError] = useState<string | null>(null);
  const [tenantEditForm, setTenantEditForm] = useState({
    companyName: '',
    availableFrom: '',
    availableTo: '',
    isListed: true,
  });

  // Tenant form state
  const [tenantForm, setTenantForm] = useState<TenantFormData>({
    name: '',
    email: '',
    password: '',
    bio: '',
    dateOfBirth: '',
    phoneNumber: '',
    companyName: '',
    availableFrom: '',
    availableTo: '',
  });

  // Room form state
  const [roomForm, setRoomForm] = useState<RoomFormData>({
    propertyName: '',
    propertyType: '',
    address: '',
    city: '',
    state: '',
    yearBuilt: undefined,
    propertyDescription: '',
    suiteNumber: '',
    floor: undefined,
    totalRooms: undefined,
    totalBathrooms: undefined,
    suiteDescription: '',
    monthlyRent: 0,
    availableFrom: '',
    availableTo: '',
    roomDescription: '',
    amenityIDs: [],
    photoUrls: [],
  });

  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);

  useEffect(() => {
    loadAmenities();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Pre-fill account fields from auth context (these are read-only in the form)
    setTenantForm((prev) => ({
      ...prev,
      name: user.name ?? '',
      email: user.email ?? '',
      bio: user.bio ?? '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toString().slice(0, 10) : '',
      phoneNumber: user.phoneNumber ?? '',
    }));
    fetch(`/api/tenants?accountID=${user.accountID}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((tenants: any[]) => {
        if (tenants.length > 0) {
          const t = tenants[0];
          setExistingTenant({
            tenantID: t.tenantID,
            companyName: t.companyName,
            availableFrom: t.availableFrom,
            availableTo: t.availableTo,
            isListed: !!t.isListed,
          });
        } else {
          setExistingTenant(null);
        }
      })
      .catch(() => setExistingTenant(null));
  }, [user]);

  const handleTenantEditOpen = () => {
    if (!existingTenant) return;
    setTenantEditForm({
      companyName: existingTenant.companyName ?? '',
      availableFrom: existingTenant.availableFrom
        ? existingTenant.availableFrom.toString().slice(0, 10)
        : '',
      availableTo: existingTenant.availableTo
        ? existingTenant.availableTo.toString().slice(0, 10)
        : '',
      isListed: existingTenant.isListed,
    });
    setTenantEditError(null);
    setTenantEditing(true);
  };

  const handleTenantEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantEditSaving(true);
    setTenantEditError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenant: {
            companyName: tenantEditForm.companyName || null,
            availableFrom: tenantEditForm.availableFrom || null,
            availableTo: tenantEditForm.availableTo || null,
            isListed: tenantEditForm.isListed,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }
      const data = await res.json();
      if (data.tenant) {
        setExistingTenant({
          tenantID: data.tenant.tenantID,
          companyName: data.tenant.companyName,
          availableFrom: data.tenant.availableFrom,
          availableTo: data.tenant.availableTo,
          isListed: !!data.tenant.isListed,
        });
      }
      setTenantEditing(false);
    } catch (err: any) {
      setTenantEditError(err.message || 'Failed to save profile');
    } finally {
      setTenantEditSaving(false);
    }
  };

  const loadAmenities = async () => {
    try {
      const response = await fetch('/api/amenities');
      if (response.ok) {
        const data = await response.json();
        setAmenities(data);
      }
    } catch (error) {
      console.error('Failed to load amenities:', error);
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(tenantForm),
      });

      if (!response.ok) throw new Error('Failed to create tenant');

      setSuccess(true);
      setTimeout(() => {
        router.push('/find-tenants');
      }, 2000);
    } catch (error) {
      console.error('Failed to create tenant listing:', error);
      alert('Failed to create tenant listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...roomForm,
          amenityIDs: selectedAmenities,
          photoUrls: photoUrls.filter(url => url.trim() !== ''),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create room');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/find-subleases');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to create room listing:', error);
      alert(error?.message || 'Failed to create room listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (amenityID: number) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityID)
        ? prev.filter(id => id !== amenityID)
        : [...prev, amenityID]
    );
  };

  const addPhotoUrl = () => {
    setPhotoUrls([...photoUrls, '']);
  };

  const updatePhotoUrl = (index: number, value: string) => {
    const newUrls = [...photoUrls];
    newUrls[index] = value;
    setPhotoUrls(newUrls);
  };

  const removePhotoUrl = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Listing Created!</h2>
            <p className="text-gray-600">
              Your {activeTab === 'tenant' ? 'tenant profile' : 'room listing'} has been successfully created.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Listing</h1>
          <p className="text-gray-600">
            Create a new tenant profile or room listing to connect with others.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tenant' | 'room')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tenant">Create Tenant Profile</TabsTrigger>
            <TabsTrigger value="room">Create Room Listing</TabsTrigger>
          </TabsList>

          <TabsContent value="tenant">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Loading: existingTenant check in-flight */}
                {existingTenant === undefined && (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Checking your profile...
                  </div>
                )}

                {/* User already has a tenant profile */}
                {existingTenant !== undefined && existingTenant !== null && (
                  tenantEditing ? (
                    <form onSubmit={handleTenantEditSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-company">Company / School</Label>
                        <Input
                          id="edit-company"
                          value={tenantEditForm.companyName}
                          onChange={(e) => setTenantEditForm({ ...tenantEditForm, companyName: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-avail-from">Available From</Label>
                          <Input
                            id="edit-avail-from"
                            type="date"
                            value={tenantEditForm.availableFrom}
                            onChange={(e) => setTenantEditForm({ ...tenantEditForm, availableFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-avail-to">Available To</Label>
                          <Input
                            id="edit-avail-to"
                            type="date"
                            value={tenantEditForm.availableTo}
                            onChange={(e) => setTenantEditForm({ ...tenantEditForm, availableTo: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          id="edit-listed"
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={tenantEditForm.isListed}
                          onChange={(e) => setTenantEditForm({ ...tenantEditForm, isListed: e.target.checked })}
                        />
                        <Label htmlFor="edit-listed">Show my profile to subleasors (listed)</Label>
                      </div>

                      {tenantEditError && (
                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{tenantEditError}</p>
                      )}

                      <div className="flex gap-3">
                        <Button type="submit" disabled={tenantEditSaving}>
                          {tenantEditSaving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setTenantEditing(false); setTenantEditError(null); }}
                          disabled={tenantEditSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-700 font-medium">You already have a tenant profile.</p>

                      <div className="space-y-2 text-sm text-gray-600">
                        {existingTenant.companyName && (
                          <p><span className="font-medium">Company / School:</span> {existingTenant.companyName}</p>
                        )}
                        {existingTenant.availableFrom && (
                          <p>
                            <span className="font-medium">Available From:</span>{' '}
                            {new Date(existingTenant.availableFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {existingTenant.availableTo && (
                          <p>
                            <span className="font-medium">Available To:</span>{' '}
                            {new Date(existingTenant.availableTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          {existingTenant.isListed ? 'Listed (visible to subleasors)' : 'Unlisted (hidden)'}
                        </p>
                      </div>

                      <Button variant="outline" onClick={handleTenantEditOpen}>
                        Edit Profile
                      </Button>
                    </div>
                  )
                )}

                {/* No tenant profile yet — show create form */}
                {existingTenant === null && (
                  <form onSubmit={handleTenantSubmit} className="space-y-4">
                    {/* Account fields — pre-filled from auth context, read-only */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tenant-name">Name</Label>
                        <Input
                          id="tenant-name"
                          value={tenantForm.name}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenant-email">Email</Label>
                        <Input
                          id="tenant-email"
                          type="email"
                          value={tenantForm.email}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tenant-dob">Date of Birth</Label>
                        <Input
                          id="tenant-dob"
                          type="date"
                          value={tenantForm.dateOfBirth}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tenant-phone">Phone Number</Label>
                        <Input
                          id="tenant-phone"
                          type="tel"
                          value={tenantForm.phoneNumber}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tenant-bio">Bio</Label>
                      <Textarea
                        id="tenant-bio"
                        rows={2}
                        value={tenantForm.bio}
                        disabled
                        className="bg-gray-50 resize-none"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      To update this information, go to{' '}
                      <a href="/profile" className="underline hover:text-gray-700">
                        Profile → Edit Account
                      </a>
                      .
                    </p>

                    <div className="border-t pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="tenant-company">Company / School</Label>
                        <Input
                          id="tenant-company"
                          value={tenantForm.companyName}
                          onChange={(e) => setTenantForm({ ...tenantForm, companyName: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tenant-start">Available From</Label>
                          <Input
                            id="tenant-start"
                            type="date"
                            value={tenantForm.availableFrom}
                            onChange={(e) => setTenantForm({ ...tenantForm, availableFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tenant-end">Available To</Label>
                          <Input
                            id="tenant-end"
                            type="date"
                            value={tenantForm.availableTo}
                            onChange={(e) => setTenantForm({ ...tenantForm, availableTo: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Tenant Profile'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="room">
            <Card>
              <CardHeader>
                <CardTitle>Room Listing</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRoomSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-property-name">Property Name *</Label>
                    <Input
                      id="room-property-name"
                      required
                      value={roomForm.propertyName}
                      onChange={(e) => setRoomForm({ ...roomForm, propertyName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-property-type">Property Type *</Label>
                      <Select
                        value={roomForm.propertyType}
                        onValueChange={(value) => setRoomForm({ ...roomForm, propertyType: value || '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="condo">Condo</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-year-built">Year Built</Label>
                      <Input
                        id="room-year-built"
                        type="number"
                        value={roomForm.yearBuilt || ''}
                        onChange={(e) => setRoomForm({ ...roomForm, yearBuilt: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-address">Address *</Label>
                    <Input
                      id="room-address"
                      required
                      value={roomForm.address}
                      onChange={(e) => setRoomForm({ ...roomForm, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-city">City *</Label>
                      <Input
                        id="room-city"
                        required
                        value={roomForm.city}
                        onChange={(e) => setRoomForm({ ...roomForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-state">State *</Label>
                      <Input
                        id="room-state"
                        required
                        value={roomForm.state}
                        onChange={(e) => setRoomForm({ ...roomForm, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-property-desc">Property Description</Label>
                    <Textarea
                      id="room-property-desc"
                      rows={2}
                      value={roomForm.propertyDescription}
                      onChange={(e) => setRoomForm({ ...roomForm, propertyDescription: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-suite">Suite Number</Label>
                      <Input
                        id="room-suite"
                        value={roomForm.suiteNumber}
                        onChange={(e) => setRoomForm({ ...roomForm, suiteNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-floor">Floor</Label>
                      <Input
                        id="room-floor"
                        type="number"
                        value={roomForm.floor || ''}
                        onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-rooms">Total Rooms</Label>
                      <Input
                        id="room-rooms"
                        type="number"
                        value={roomForm.totalRooms || ''}
                        onChange={(e) => setRoomForm({ ...roomForm, totalRooms: parseInt(e.target.value) || undefined })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-bathrooms">Total Bathrooms</Label>
                    <Input
                      id="room-bathrooms"
                      type="number"
                      step="0.5"
                      value={roomForm.totalBathrooms || ''}
                      onChange={(e) => setRoomForm({ ...roomForm, totalBathrooms: parseFloat(e.target.value) || undefined })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-suite-desc">Suite Description</Label>
                    <Textarea
                      id="room-suite-desc"
                      rows={2}
                      value={roomForm.suiteDescription}
                      onChange={(e) => setRoomForm({ ...roomForm, suiteDescription: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-price">Monthly Rent ($) *</Label>
                    <Input
                      id="room-price"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={roomForm.monthlyRent || ''}
                      onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-available-from">Available From</Label>
                      <Input
                        id="room-available-from"
                        type="date"
                        value={roomForm.availableFrom}
                        onChange={(e) => setRoomForm({ ...roomForm, availableFrom: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="room-available-to">Available To</Label>
                      <Input
                        id="room-available-to"
                        type="date"
                        value={roomForm.availableTo}
                        onChange={(e) => setRoomForm({ ...roomForm, availableTo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room-desc">Room Description</Label>
                    <Textarea
                      id="room-desc"
                      rows={3}
                      value={roomForm.roomDescription}
                      onChange={(e) => setRoomForm({ ...roomForm, roomDescription: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity) => (
                        <button
                          key={amenity.amenityID}
                          type="button"
                          onClick={() => toggleAmenity(amenity.amenityID)}
                          className={`px-3 py-1 rounded-full text-sm border ${
                            selectedAmenities.includes(amenity.amenityID)
                              ? 'bg-blue-100 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {amenity.amenityName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Photo URLs</Label>
                    {photoUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={url}
                          onChange={(e) => updatePhotoUrl(index, e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                        />
                        {photoUrls.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removePhotoUrl(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhotoUrl}
                    >
                      Add Photo URL
                    </Button>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Room Listing'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
