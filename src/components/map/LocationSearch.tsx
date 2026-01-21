'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { GeocodingResult } from '@/types/forecast';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`
      );
      const data = await response.json();

      if (data.results) {
        setResults(data.results.map((r: {
          id: number;
          name: string;
          latitude: number;
          longitude: number;
          elevation?: number;
          country: string;
          admin1?: string;
          timezone: string;
        }) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          elevation: r.elevation,
          country: r.country,
          admin1: r.admin1,
          timezone: r.timezone,
        })));
        setIsOpen(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onLocationSelect(result.latitude, result.longitude);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="
            pl-10 pr-10 h-11 md:h-10
            text-base md:text-sm
            bg-card/95 dark:bg-card/90
            backdrop-blur-xl
            border-border/50
            shadow-lg shadow-black/5 dark:shadow-black/20
            placeholder:text-muted-foreground/60
            focus:border-primary/50 focus:ring-primary/20
            rounded-xl
          "
        />
        {isLoading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2
            bg-card/98 dark:bg-card/95
            backdrop-blur-xl
            border border-border/50
            rounded-xl
            shadow-xl shadow-black/10 dark:shadow-black/30
            overflow-hidden
            z-50
            max-h-[60vh] overflow-y-auto
          "
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`
                w-full px-4 py-3.5 md:py-3
                text-left
                hover:bg-primary/5 active:bg-primary/10
                transition-colors duration-150
                flex items-start gap-3
                min-h-[56px] md:min-h-0
                touch-manipulation
                ${index !== results.length - 1 ? 'border-b border-border/30' : ''}
              `}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-foreground truncate">
                  {result.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {[result.admin1, result.country].filter(Boolean).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
