"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  error?: boolean;
  countryRestriction?: string; // ISO 3166-1 Alpha-2 country code (e.g., 'za' for South Africa)
}

declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces: () => void;
  }
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter your address",
  className = "",
  id = "address-autocomplete",
  error = false,
  countryRestriction = "za", // Default to South Africa
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places?.Autocomplete) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      // Script exists, wait for it to load
      setScriptLoading(true);
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
          setIsLoaded(true);
          setScriptLoading(false);
          clearInterval(checkLoaded);
        }
      }, 100);

      return () => clearInterval(checkLoaded);
    }

    // Get API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("Google Maps API key is not set. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.");
      console.error("Current env check:", {
        hasKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        keyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length,
      });
      return;
    }

    // Load Google Maps script
    setScriptLoading(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        setIsLoaded(true);
        setScriptLoading(false);
      }
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setScriptLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    // Clean up existing autocomplete
    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }

    // Wait a bit to ensure the input is fully rendered
    const timer = setTimeout(() => {
      if (!inputRef.current || !window.google?.maps?.places?.Autocomplete) {
        return;
      }

      try {
        // Initialize autocomplete
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            componentRestrictions: countryRestriction
              ? { country: countryRestriction }
              : undefined,
            fields: ["formatted_address", "address_components", "geometry"],
            types: ["address"],
          }
        );

        autocompleteRef.current = autocomplete;

        // Handle place selection
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            onChange(place.formatted_address);
            if (onPlaceSelect) {
              onPlaceSelect(place);
            }
          }
        });
      } catch (error) {
        console.error("Error initializing Google Places Autocomplete:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (autocompleteRef.current) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          // Ignore cleanup errors
        }
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, onChange, onPlaceSelect, countryRestriction]);

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={scriptLoading ? "Loading address suggestions..." : placeholder}
      className={error ? `border-red-500 ${className}` : className}
      autoComplete="off"
      disabled={scriptLoading}
    />
  );
}
