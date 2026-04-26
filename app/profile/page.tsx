'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Edit, LogOut, Loader2, X, Check } from 'lucide-react';
import Link from 'next/link';

interface TenantInfo {
  tenantID: number;
  companyName: string | null;
  availableFrom: string | null;
  availableTo: string | null;
  isListed: boolean;
}

interface SentApplication {
  applicationID: number;
  roomID: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  appliedAt: string;
  monthlyRent: number;
  propertyName: string;
  address: string;
  city: string;
  state: string;
}

interface ReceivedApplication {
  applicationID: number;
  tenantID: number;
  roomID: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  appliedAt: string;
  monthlyRent: number;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  applicantName: string;
  applicantEmail: string;
}

interface ContractRow {
  contractID: number;
  roomID: number;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  signedAt: string;
  propertyName: string;
  address: string;
  city: string;
  state: string;
  role: 'tenant' | 'subleasor';
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string | null;
  subleasorName: string;
  subleasorEmail: string;
  subleasorPhone: string | null;
}

interface EditForm {
  name: string;
  bio: string;
  dateOfBirth: string;
  phoneNumber: string;
  companyName: string;
  availableFrom: string;
  availableTo: string;
  isListed: boolean;
}

export default function ProfilePage() {
  const { user, token, logout, updateUser, isAuthenticated, loading } = useAuth();

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [myRoom, setMyRoom] = useState<any | null>(undefined); // undefined = not yet fetched
  const [sentApps, setSentApps] = useState<SentApplication[]>([]);
  const [receivedApps, setReceivedApps] = useState<ReceivedApplication[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [listingFilled, setListingFilled] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    bio: '',
    dateOfBirth: '',
    phoneNumber: '',
    companyName: '',
    availableFrom: '',
    availableTo: '',
    isListed: true,
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfileData();
    }
  }, [isAuthenticated, user]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const loadProfileData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [tenantRes, roomRes, sentRes, receivedRes, contractRes] = await Promise.all([
        fetch(`/api/tenants?accountID=${user.accountID}`),
        fetch(`/api/rooms?subleasorAccountID=${user.accountID}`),
        fetch('/api/applications?type=sent', { headers: authHeaders }),
        fetch('/api/applications?type=received', { headers: authHeaders }),
        fetch('/api/contracts', { headers: authHeaders }),
      ]);

      if (roomRes.ok) setMyRoom(await roomRes.json());
      else setMyRoom(null);

      if (sentRes.ok) setSentApps(await sentRes.json());
      if (receivedRes.ok) setReceivedApps(await receivedRes.json());
      if (contractRes.ok) setContracts(await contractRes.json());

      if (tenantRes.ok) {
        const tenants = await tenantRes.json();
        if (tenants.length > 0) {
          const t = tenants[0];
          setTenant({
            tenantID: t.tenantID,
            companyName: t.companyName,
            availableFrom: t.availableFrom,
            availableTo: t.availableTo,
            isListed: !!t.isListed,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleWithdraw = async (applicationID: number) => {
    setActionLoading(applicationID);
    try {
      const res = await fetch(`/api/applications/${applicationID}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to withdraw');
      }
      setSentApps((prev) => prev.filter((a) => a.applicationID !== applicationID));
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw application');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (
    applicationID: number,
    status: 'accepted' | 'rejected'
  ) => {
    setActionLoading(applicationID);
    try {
      const res = await fetch(`/api/applications/${applicationID}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update application');
      }
      setReceivedApps((prev) =>
        prev.map((a) => (a.applicationID === applicationID ? { ...a, status } : a))
      );
      if (status === 'accepted' && user) {
        const roomRes = await fetch(`/api/rooms?subleasorAccountID=${user.accountID}`);
        if (roomRes.ok) setMyRoom(await roomRes.json());
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update application');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleListed = async () => {
    if (!myRoom || !token) return;
    setRoomActionLoading(true);
    try {
      const newIsListed = !myRoom.isListed;
      const res = await fetch(`/api/rooms/${myRoom.roomID}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isListed: newIsListed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 403 && err.error?.includes('accepted application')) {
          setListingFilled(true);
          return;
        }
        throw new Error(err.error || 'Failed to update listing');
      }
      setMyRoom({ ...myRoom, isListed: newIsListed });
    } catch (err: any) {
      alert(err.message || 'Failed to update listing');
    } finally {
      setRoomActionLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!myRoom || !token) return;
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    setRoomActionLoading(true);
    try {
      const res = await fetch(`/api/rooms/${myRoom.roomID}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete listing');
      }
      setMyRoom(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing');
    } finally {
      setRoomActionLoading(false);
    }
  };

  const handleEditOpen = () => {
    if (!user) return;
    setEditForm({
      name: user.name ?? '',
      bio: user.bio ?? '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toString().slice(0, 10) : '',
      phoneNumber: user.phoneNumber ?? '',
      companyName: tenant?.companyName ?? '',
      availableFrom: tenant?.availableFrom ? tenant.availableFrom.toString().slice(0, 10) : '',
      availableTo: tenant?.availableTo ? tenant.availableTo.toString().slice(0, 10) : '',
      isListed: tenant?.isListed ?? true,
    });
    setSaveError(null);
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
    setSaveError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);

    try {
      const body: Record<string, unknown> = {
        name: editForm.name,
        bio: editForm.bio || null,
        dateOfBirth: editForm.dateOfBirth || null,
        phoneNumber: editForm.phoneNumber || null,
      };

      if (tenant) {
        body.tenant = {
          companyName: editForm.companyName || null,
          availableFrom: editForm.availableFrom || null,
          availableTo: editForm.availableTo || null,
          isListed: editForm.isListed,
        };
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      const data = await res.json();

      updateUser({
        accountID: data.account.accountID,
        name: data.account.name,
        email: data.account.email,
        bio: data.account.bio,
        dateOfBirth: data.account.dateOfBirth,
        phoneNumber: data.account.phoneNumber,
      });

      if (data.tenant) {
        setTenant({
          tenantID: data.tenant.tenantID,
          companyName: data.tenant.companyName,
          availableFrom: data.tenant.availableFrom,
          availableTo: data.tenant.availableTo,
          isListed: !!data.tenant.isListed,
        });
      }

      setEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusVariant = (status: string) => {
    if (status === 'accepted') return 'default';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
  };

  // True when any received application for the user's own listing is accepted.
  // Derived from already-fetched data — no extra API call needed.
  const roomHasAcceptedApp =
    !!myRoom &&
    receivedApps.some(
      (a) => a.roomID === myRoom.roomID && a.status === 'accepted'
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and listings.</p>
        </div>

        {/* Profile card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <p className="text-gray-600">{user.email}</p>
              </div>
              {!editing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleEditOpen}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {editing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-phone">Phone Number</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-dob">Date of Birth</Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea
                    id="edit-bio"
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {tenant && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Tenant Profile</p>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-company">Company</Label>
                        <Input
                          id="edit-company"
                          value={editForm.companyName}
                          onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="edit-avail-from">Available From</Label>
                          <Input
                            id="edit-avail-from"
                            type="date"
                            value={editForm.availableFrom}
                            onChange={(e) => setEditForm({ ...editForm, availableFrom: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="edit-avail-to">Available To</Label>
                          <Input
                            id="edit-avail-to"
                            type="date"
                            value={editForm.availableTo}
                            onChange={(e) => setEditForm({ ...editForm, availableTo: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          id="edit-listed"
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={editForm.isListed}
                          onChange={(e) => setEditForm({ ...editForm, isListed: e.target.checked })}
                        />
                        <Label htmlFor="edit-listed" className="cursor-pointer">
                          Show my profile to subleasors (listed)
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {saveError && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{saveError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleEditCancel} disabled={saving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {user.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">About</h3>
                    <p className="text-gray-600">Bio: {user.bio}</p>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div className="flex items-center text-gray-600">
                    <span>Date of Birth: {formatDate(user.dateOfBirth)}</span>
                  </div>
                )}
                {user.phoneNumber && (
                  <div className="flex items-center text-gray-600">
                    <span>Phone: {user.phoneNumber}</span>
                  </div>
                )}
                {tenant && (
                  <div className="border-t pt-4 space-y-1 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">Tenant Profile</p>
                    {tenant.companyName && <p>Company: {tenant.companyName}</p>}
                    {(tenant.availableFrom || tenant.availableTo) && (
                      <p>
                        Available: {formatDate(tenant.availableFrom)} – {formatDate(tenant.availableTo)}
                      </p>
                    )}
                    <p>
                      Status:{' '}
                      <Badge variant={tenant.isListed ? 'default' : 'secondary'}>
                        {tenant.isListed ? 'Listed' : 'Unlisted'}
                      </Badge>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* My Listing */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Listing</h2>
            <Card>
              {dataLoading || myRoom === undefined ? (
                <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
              ) : myRoom === null ? (
                <CardContent className="py-8 text-center text-gray-500">
                  <p className="mb-4">You don&apos;t have a room listing yet.</p>
                  <Link href="/create-listing">
                    <Button>Create Listing</Button>
                  </Link>
                </CardContent>
              ) : (
                <CardContent className="px-6 py-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/sublease/${myRoom.roomID}`}
                        className="text-lg font-semibold text-blue-600 hover:underline"
                      >
                        {myRoom.suite?.property?.propertyName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {myRoom.suite?.property?.address}, {myRoom.suite?.property?.city},{' '}
                        {myRoom.suite?.property?.state}
                      </p>
                    </div>
                    <Badge variant={myRoom.isListed ? 'default' : 'secondary'}>
                      {myRoom.isListed ? 'Listed' : 'Unlisted'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Rent:</span> ${myRoom.monthlyRent}/mo
                    </p>
                    <p>
                      <span className="font-medium">Type:</span>{' '}
                      {myRoom.suite?.property?.propertyType ?? '—'}
                    </p>
                    <p>
                      <span className="font-medium">Available:</span>{' '}
                      {formatDate(myRoom.availableFrom)} – {formatDate(myRoom.availableTo)}
                    </p>
                    {myRoom.amenities?.length > 0 && (
                      <p>
                        <span className="font-medium">Amenities:</span>{' '}
                        {myRoom.amenities.map((a: any) => a.amenityName).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2 items-center">
                    <Link href={`/sublease/${myRoom.roomID}`}>
                      <Button variant="outline" size="sm">View Listing</Button>
                    </Link>

                    {roomHasAcceptedApp ? (
                      <p className="text-xs text-gray-500">
                        This listing has an accepted application and cannot be modified or deleted.
                      </p>
                    ) : (
                      <>
                        {myRoom.isListed ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            disabled={roomActionLoading}
                            onClick={handleToggleListed}
                          >
                            {roomActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Unlist'
                            )}
                          </Button>
                        ) : listingFilled ? (
                          <p className="text-xs text-gray-500">
                            This listing has been filled and cannot be re-listed.
                          </p>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            disabled={roomActionLoading}
                            onClick={handleToggleListed}
                          >
                            {roomActionLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Re-list'
                            )}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={roomActionLoading}
                          onClick={handleDeleteListing}
                        >
                          {roomActionLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Delete Listing'
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Applications I Sent */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications I Sent</h2>
            <Card>
              {dataLoading ? (
                <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
              ) : sentApps.length === 0 ? (
                <CardContent className="py-8 text-center text-gray-500">
                  <p className="mb-4">No applications sent yet.</p>
                  <Link href="/find-subleases">
                    <Button variant="outline">Browse Rooms</Button>
                  </Link>
                </CardContent>
              ) : (
                <CardContent className="p-0 divide-y">
                  {sentApps.map((app) => (
                    <div key={app.applicationID} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/sublease/${app.roomID}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {app.propertyName}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {app.address}, {app.city}, {app.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${app.monthlyRent}/mo · Applied {formatDate(app.appliedAt)}
                          </p>
                          {app.message && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              &ldquo;{app.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                          {app.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              disabled={actionLoading === app.applicationID}
                              onClick={() => handleWithdraw(app.applicationID)}
                            >
                              {actionLoading === app.applicationID ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Withdraw'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Applications I Received */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications I Received</h2>
            <Card>
              {dataLoading ? (
                <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
              ) : receivedApps.length === 0 ? (
                <CardContent className="py-8 text-center text-gray-500">
                  <p>No applications received yet.</p>
                </CardContent>
              ) : (
                <CardContent className="p-0 divide-y">
                  {receivedApps.map((app) => (
                    <div key={app.applicationID} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{app.applicantName}</p>
                          <p className="text-sm text-gray-500">{app.applicantEmail}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            For:{' '}
                            <Link
                              href={`/sublease/${app.roomID}`}
                              className="text-blue-600 hover:underline"
                            >
                              {app.propertyName}
                            </Link>
                            {' '}· {app.address}, {app.city}, {app.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            Applied {formatDate(app.appliedAt)}
                          </p>
                          {app.message && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              &ldquo;{app.message}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                          {app.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                disabled={actionLoading === app.applicationID}
                                onClick={() => handleStatusChange(app.applicationID, 'accepted')}
                              >
                                {actionLoading === app.applicationID ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Accept'
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                disabled={actionLoading === app.applicationID}
                                onClick={() => handleStatusChange(app.applicationID, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>

          {/* My Contracts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Contracts</h2>
            <Card>
              {dataLoading ? (
                <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
              ) : contracts.length === 0 ? (
                <CardContent className="py-8 text-center text-gray-500">
                  <p>No contracts yet.</p>
                </CardContent>
              ) : (
                <CardContent className="p-0 divide-y">
                  {contracts.map((contract) => (
                    <div key={contract.contractID} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <Link
                          href={`/sublease/${contract.roomID}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {contract.propertyName}
                        </Link>
                        <Badge
                          className={
                            contract.role === 'tenant'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100 flex-shrink-0'
                              : 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-100 flex-shrink-0'
                          }
                        >
                          {contract.role === 'tenant' ? 'As Tenant' : 'As Subleasor'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {contract.address}, {contract.city}, {contract.state}
                      </p>
                      <p className="text-sm text-gray-500">${contract.monthlyRent}/mo</p>
                      <p className="text-sm text-gray-500">
                        Lease: {formatDate(contract.leaseStart)} – {formatDate(contract.leaseEnd)}
                      </p>
                      <p className="text-sm text-gray-400">Signed {formatDate(contract.signedAt)}</p>
                      <div className="mt-2 pt-2 border-t text-sm text-gray-500">
                        {contract.role === 'tenant' ? (
                          <p>
                            <span className="font-medium">Subleasor:</span>{' '}
                            {contract.subleasorName} | {contract.subleasorEmail}
                            {contract.subleasorPhone ? ` | ${contract.subleasorPhone}` : ''}
                          </p>
                        ) : (
                          <p>
                            <span className="font-medium">Tenant:</span>{' '}
                            {contract.tenantName} | {contract.tenantEmail}
                            {contract.tenantPhone ? ` | ${contract.tenantPhone}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
