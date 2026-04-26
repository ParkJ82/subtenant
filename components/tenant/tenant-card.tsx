'use client';

import { TenantWithAccount } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Calendar, Building } from 'lucide-react';
import Link from 'next/link';

interface TenantCardProps {
  tenant: TenantWithAccount;
  isOwnProfile?: boolean;
}

export function TenantCard({ tenant, isOwnProfile }: TenantCardProps) {
  const initials = tenant.account.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/tenant/${tenant.tenantID}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{tenant.account.name}</h3>
                <p className="text-sm text-gray-500">{tenant.account.email}</p>
              </div>
            </div>
            {isOwnProfile && (
              <Badge className="bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-100 flex-shrink-0">
                Your Profile
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tenant.companyName && (
            <div className="flex items-center text-sm text-gray-600">
              <Building className="w-4 h-4 mr-2 text-gray-400" />
              <span>{tenant.companyName}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>
              {formatDate(tenant.availableFrom)} - {formatDate(tenant.availableTo)}
            </span>
          </div>

          {tenant.account.bio && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {tenant.account.bio}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
