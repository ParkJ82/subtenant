'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, HomeIcon, Plus, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Sublease
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with interns and subleasors to find the perfect housing match for your internship.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/find-tenants">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Find Tenants</h3>
                <p className="text-gray-600">
                  Browse and search for interns looking for subleases in your area.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/find-subleases">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <HomeIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Find Subleases</h3>
                <p className="text-gray-600">
                  Discover available rooms and apartments for your internship stay.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/create-listing">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Listing</h3>
                <p className="text-gray-600">
                  Post your profile as a tenant or list your room as a subleasor.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-600 text-sm">
                Sign up and create your profile as either a tenant looking for a sublease or a subleasor with a room to offer.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Browse & Search</h3>
              <p className="text-gray-600 text-sm">
                Use our search and filter tools to find the perfect match based on location, dates, and preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Connect & Book</h3>
              <p className="text-gray-600 text-sm">
                Contact potential matches directly and finalize your sublease arrangement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
