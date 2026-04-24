'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TenantWithAccount } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, Mail, ArrowLeft, Loader2, Building, Phone } from 'lucide-react';

export default function TenantInfoPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantWithAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenant();
  }, [params.id]);

  const loadTenant = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tenants/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch tenant');
      const data = await response.json();
      setTenant(data);
    } catch (err) {
      console.error('Failed to load tenant:', err);
      setError('Failed to load tenant information.');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (tenant) {
      window.location.href = `mailto:${tenant.account.email}?subject=SubTenants - Regarding your sublease search`;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">{error || 'Tenant not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const initials = tenant.account.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{tenant.account.name}</CardTitle>
                  <p className="text-gray-600">{tenant.account.email}</p>
                  <Badge variant={tenant.isListed ? 'default' : 'secondary'} className="mt-2">
                    {tenant.isListed ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {tenant.companyName && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Company</h3>
                <div className="flex items-center text-gray-600">
                  <Building className="w-4 h-4 mr-2" />
                  <span>{tenant.companyName}</span>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Availability</h3>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {formatDate(tenant.availableFrom)} - {formatDate(tenant.availableTo)}
                </span>
              </div>
            </div>

            {tenant.account.bio && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600 leading-relaxed">
                  {tenant.account.bio}
                </p>
              </div>
            )}

            {tenant.account.phoneNumber && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{tenant.account.phoneNumber}</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button onClick={handleContact} className="w-full sm:w-auto" size="lg">
                <Mail className="w-4 h-4 mr-2" />
                Contact {tenant.account.name}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
