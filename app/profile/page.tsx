'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Edit, LogOut } from 'lucide-react';
import Link from 'next/link';

interface ApplicationRow {
  applicationID: number;
  roomID: number;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  monthlyRent: number;
  propertyName: string;
  address: string;
  city: string;
  state: string;
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
}

export default function ProfilePage() {
  const { user, token, logout, isAuthenticated, loading } = useAuth();
  const [tenantID, setTenantID] = useState<number | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfileData();
    }
  }, [isAuthenticated, user]);

  const loadProfileData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      // Look up the user's Tenant record by accountID
      const tenantRes = await fetch(`/api/tenants?accountID=${user.accountID}`);
      if (tenantRes.ok) {
        const tenants = await tenantRes.json();
        if (tenants.length > 0) {
          const tid = tenants[0].tenantID;
          setTenantID(tid);

          // Fetch applications and contracts in parallel
          const [appRes, contractRes] = await Promise.all([
            fetch(`/api/applications?tenantID=${tid}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`/api/contracts?tenantID=${tid}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (appRes.ok) setApplications(await appRes.json());
          if (contractRes.ok) setContracts(await contractRes.json());
        }
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setDataLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and listings.</p>
        </div>

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
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">{user.bio}</p>
              </div>
            )}
            {user.dateOfBirth && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <span>Born: {formatDate(user.dateOfBirth)}</span>
              </div>
            )}
            {user.phoneNumber && (
              <div className="flex items-center text-gray-600">
                <span className="w-5 h-5 mr-3 text-gray-400 flex items-center justify-center">📞</span>
                <span>{user.phoneNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Listings</h2>
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <p className="mb-4">Create your first listing to get started.</p>
                <Link href="/create-listing">
                  <Button>Create Listing</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Applications</h2>
            <Card>
              {dataLoading ? (
                <CardContent className="py-8 text-center text-gray-400">Loading...</CardContent>
              ) : applications.length === 0 ? (
                <CardContent className="py-8 text-center text-gray-500">
                  <p className="mb-4">No applications yet.</p>
                  <Link href="/find-subleases">
                    <Button variant="outline">Browse Rooms</Button>
                  </Link>
                </CardContent>
              ) : (
                <CardContent className="p-0 divide-y">
                  {applications.map((app) => (
                    <div key={app.applicationID} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <Link href={`/sublease/${app.roomID}`} className="font-medium text-blue-600 hover:underline">
                          {app.propertyName}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {app.address}, {app.city}, {app.state}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${app.monthlyRent}/mo · Applied {formatDate(app.appliedAt)}
                        </p>
                      </div>
                      <Badge variant={statusVariant(app.status)}>{app.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>

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
                      <Link href={`/sublease/${contract.roomID}`} className="font-medium text-blue-600 hover:underline">
                        {contract.propertyName}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {contract.address}, {contract.city}, {contract.state}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${contract.monthlyRent}/mo
                      </p>
                      <p className="text-sm text-gray-500">
                        Lease: {formatDate(contract.leaseStart)} – {formatDate(contract.leaseEnd)}
                      </p>
                      <p className="text-sm text-gray-400">Signed {formatDate(contract.signedAt)}</p>
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
