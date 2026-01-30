"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useGooglePlacesScript } from "@/lib/address/useGooglePlacesScript";
import {
  parseGooglePlace,
  type ParsedAddress,
  type PlaceResultLike,
} from "@/lib/address/parseGooglePlace";

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: ParsedAddress) => void;
  placeholder?: string;
  disabled?: boolean;
  countryRestrictions?: string[];
  className?: string;
  id?: string;
  error?: boolean;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter your address",
  disabled = false,
  countryRestrictions = ["za"],
  className = "",
  id = "address-autocomplete",
  error = false,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  const lastSyncedValueRef = useRef(value);

  const { isLoaded, isLoading, failed } = useGooglePlacesScript();

  onChangeRef.current = onChange;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!isLoaded || !inputRef.current || typeof window === "undefined") return;
    if (!window.google?.maps?.places?.Autocomplete) return;
    if (autocompleteRef.current) return;

    const inputEl = inputRef.current;
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputEl,
        {
          componentRestrictions:
            countryRestrictions.length > 0
              ? { country: countryRestrictions }
              : undefined,
          fields: [
            "formatted_address",
            "name",
            "address_components",
            "geometry",
          ],
          types: ["address"],
        }
      );
      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const parsed = parseGooglePlace(place as unknown as PlaceResultLike);
        const address = parsed.formatted_address || inputEl.value?.trim() || "";
        if (address) {
          inputEl.value = address;
          lastSyncedValueRef.current = address;
          onChangeRef.current(address);
          onSelectRef.current(parsed);
        }
      });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Error initializing Google Places Autocomplete:", err);
      }
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (_) {}
        autocompleteRef.current = null;
      }
    };
  }, [isLoaded, countryRestrictions]);

  useEffect(() => {
    if (value === lastSyncedValueRef.current) return;
    lastSyncedValueRef.current = value;
    if (inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  const useFallback = failed || disabled;

  return (
    <div className="space-y-1">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        defaultValue={value}
        onChange={(e) => {
          const next = e.target.value;
          lastSyncedValueRef.current = next;
          onChange(next);
        }}
        placeholder={
          isLoading
            ? "Loading address suggestions..."
            : useFallback
              ? "Enter your address"
              : placeholder
        }
        className={error ? `border-red-500 ${className}` : className}
        autoComplete="off"
        disabled={isLoading || disabled}
      />
      <p className="text-xs text-muted-foreground">
        Start typing and choose an address from the suggestions.
      </p>
    </div>
  );
}
