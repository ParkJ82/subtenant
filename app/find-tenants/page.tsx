'use client';

import { useState, useEffect } from 'react';
import { TenantCard } from '@/components/tenant/tenant-card';
import { SearchBar } from '@/components/layout/search-bar';
import { TenantWithAccount } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function FindTenantsPage() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<TenantWithAccount[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data);
      setFilteredTenants(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
      setError('Failed to load tenants. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredTenants(tenants);
      return;
    }

    const filtered = tenants.filter(tenant =>
      tenant.account.name.toLowerCase().includes(query.toLowerCase()) ||
      tenant.account.email.toLowerCase().includes(query.toLowerCase()) ||
      (tenant.companyName && tenant.companyName.toLowerCase().includes(query.toLowerCase())) ||
      (tenant.account.bio && tenant.account.bio.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredTenants(filtered);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Intern Tenants</h1>
          <p className="text-gray-600">
            Browse and search for interns looking for subleases in your area.
          </p>
        </div>

        <div className="mb-8">
          <SearchBar
            placeholder="Search by name, company, or description..."
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
              onClick={loadTenants}
              className="text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'No tenants found matching your search.' : 'No tenants available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.tenantID}
                tenant={tenant}
                isOwnProfile={!!user && tenant.accountID === user.accountID}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
