'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilterClick?: () => void;
  showFilterButton?: boolean;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onFilterClick,
  showFilterButton = true,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      {showFilterButton && onFilterClick && (
        <Button type="button" variant="outline" size="icon" onClick={onFilterClick}>
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      )}
      <Button type="submit">Search</Button>
    </form>
  );
}
