"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
  }
}

export interface UseGooglePlacesScriptResult {
  isLoaded: boolean;
  isLoading: boolean;
  failed: boolean;
}

/**
 * Single-instance loader for Google Maps Places script.
 * SSR-safe: returns safe defaults when window is undefined.
 * Use this so all AddressAutocomplete instances share one script load.
 */
export function useGooglePlacesScript(): UseGooglePlacesScriptResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.maps?.places?.Autocomplete) {
      setIsLoaded(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      setIsLoading(true);
      let elapsed = 0;
      const maxWait = 10000;
      const checkLoaded = setInterval(() => {
        elapsed += 100;
        if (window.google?.maps?.places?.Autocomplete) {
          setIsLoaded(true);
          setIsLoading(false);
          setFailed(false);
          clearInterval(checkLoaded);
        } else if (elapsed >= maxWait) {
          setFailed(true);
          setIsLoading(false);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Google Maps API key is not set. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env for address suggestions."
        );
      }
      setFailed(true);
      return;
    }

    setIsLoading(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places?.Autocomplete) {
        setIsLoaded(true);
        setFailed(false);
      } else {
        setFailed(true);
      }
      setIsLoading(false);
    };
    script.onerror = () => {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Failed to load Google Maps script. Check CSP and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. Using plain input."
        );
      }
      setFailed(true);
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  return { isLoaded, isLoading, failed };
}
