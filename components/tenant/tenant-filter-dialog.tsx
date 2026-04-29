'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TenantFilters } from '@/lib/types';

interface TenantFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: TenantFilters) => void;
}

export function TenantFilterDialog({ open, onOpenChange, onApplyFilters }: TenantFilterDialogProps) {
  const [filters, setFilters] = useState<TenantFilters>({});

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Tenants</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name/Location Search */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium">
              Name or Location
            </Label>
            <Input
              id="location"
              placeholder="Search by name or location"
              value={filters.location || ''}
              onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
              className="mt-1"
            />
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="companyName" className="text-sm font-medium">
              Company Name
            </Label>
            <Input
              id="companyName"
              placeholder="Company name"
              value={filters.companyName || ''}
              onChange={(e) => setFilters({ ...filters, companyName: e.target.value || undefined })}
              className="mt-1"
            />
          </div>

          {/* Available From */}
          <div>
            <Label htmlFor="availableFrom" className="text-sm font-medium">
              Available From
            </Label>
            <Input
              id="availableFrom"
              type="date"
              value={filters.availableFrom || ''}
              onChange={(e) => setFilters({ ...filters, availableFrom: e.target.value || undefined })}
              className="mt-1"
            />
          </div>

          {/* Available To */}
          <div>
            <Label htmlFor="availableTo" className="text-sm font-medium">
              Available To
            </Label>
            <Input
              id="availableTo"
              type="date"
              value={filters.availableTo || ''}
              onChange={(e) => setFilters({ ...filters, availableTo: e.target.value || undefined })}
              className="mt-1"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
