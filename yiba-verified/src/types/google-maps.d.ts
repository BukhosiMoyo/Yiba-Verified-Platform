// Type definitions for Google Maps JavaScript API
// These are minimal types needed for Places Autocomplete

declare namespace google {
  namespace maps {
    namespace places {
      interface AutocompleteOptions {
        componentRestrictions?: { country: string | string[] };
        fields?: string[];
        types?: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        address_components?: AddressComponent[];
        geometry?: {
          location?: {
            lat(): number;
            lng(): number;
          };
        };
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
        getPlace(): PlaceResult;
        addListener(event: string, callback: () => void): void;
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }
}
