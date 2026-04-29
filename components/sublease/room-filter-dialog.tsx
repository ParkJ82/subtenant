'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Amenity, RoomFilters } from '@/lib/types';

interface RoomFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: RoomFilters) => void;
}

export function RoomFilterDialog({ open, onOpenChange, onApplyFilters }: RoomFilterDialogProps) {
  const [filters, setFilters] = useState<RoomFilters>({});
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAmenities();
    }
  }, [open]);

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

  const handleApply = () => {
    const updatedFilters = { ...filters };
    if (selectedAmenities.length > 0) {
      updatedFilters.amenityIDs = selectedAmenities;
    }
    onApplyFilters(updatedFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({});
    setSelectedAmenities([]);
  };

  const toggleAmenity = (amenityID: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityID)
        ? prev.filter((id) => id !== amenityID)
        : [...prev, amenityID]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Rooms</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="location"
              placeholder="City, state, or address"
              value={filters.location || ''}
              onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
              className="mt-1"
            />
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minPrice" className="text-sm font-medium">
                Min Price
              </Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-sm font-medium">
                Max Price
              </Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                className="mt-1"
              />
            </div>
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

          {/* Property Type */}
          <div>
            <Label htmlFor="propertyType" className="text-sm font-medium">
              Property Type
            </Label>
            <Select
              value={filters.propertyType || ''}
              onValueChange={(value) => setFilters({ ...filters, propertyType: value || undefined })}
            >
              <SelectTrigger id="propertyType" className="mt-1">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-sm font-medium">Amenities</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {amenities.map((amenity) => (
                <label key={amenity.amenityID} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(amenity.amenityID)}
                    onChange={() => toggleAmenity(amenity.amenityID)}
                    className="rounded"
                  />
                  <span className="text-sm">{amenity.amenityName}</span>
                </label>
              ))}
            </div>
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
