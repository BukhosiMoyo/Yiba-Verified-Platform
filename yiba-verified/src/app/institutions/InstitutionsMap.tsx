"use client";

import { useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon in Next.js (avoid 404)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const SOUTH_AFRICA_CENTER: [number, number] = [-26.2, 28.5];
const DEFAULT_ZOOM = 5;

export type MapItem = {
  slug: string;
  latitude: number | null;
  longitude: number | null;
  institution: { legal_name: string; trading_name: string | null };
};

type FlyToMarkerProps = {
  selectedSlug: string | null;
  items: MapItem[];
};

function FlyToMarker({ selectedSlug, items }: FlyToMarkerProps) {
  const map = useMap();
  const item = selectedSlug ? items.find((i) => i.slug === selectedSlug) : null;
  useEffect(() => {
    if (item?.latitude != null && item?.longitude != null) {
      map.flyTo([item.latitude, item.longitude], 14, { duration: 0.5 });
    }
  }, [item?.slug, item?.latitude, item?.longitude, map]);
  return null;
}

type Props = {
  items: MapItem[];
  selectedSlug: string | null;
  onMarkerClick: (slug: string) => void;
};

export function InstitutionsMap({ items, selectedSlug, onMarkerClick }: Props) {
  const withCoords = items.filter(
    (i): i is MapItem & { latitude: number; longitude: number } =>
      i.latitude != null && i.longitude != null
  );

  if (withCoords.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground">
        <p className="text-sm">No locations to show on map</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[300px] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={SOUTH_AFRICA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToMarker selectedSlug={selectedSlug} items={withCoords} />
        {withCoords.map((item) => (
          <Marker
            key={item.slug}
            position={[item.latitude, item.longitude]}
            eventHandlers={{
              click: () => onMarkerClick(item.slug),
            }}
          >
            <Popup>
              <span className="font-medium">
                {item.institution.trading_name || item.institution.legal_name}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
