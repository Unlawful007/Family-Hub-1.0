import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { MapPin } from '../icons/LucideIcons';

// Fix for default icon path issue without bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white/60 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-2xl p-4 shadow-md ${className}`}>
        {children}
    </div>
);

const LocationMapWidget: React.FC = () => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const members = useLiveQuery(() => db.members.toArray(), []);
    const markersRef = useRef<{ [key: number]: L.Marker }>({});

    // Mock locations and privacy settings
    const [locations, setLocations] = useState<{ [key: number]: { lat: number, lng: number } }>({});
    const [privacy, setPrivacy] = useState<{ [key: number]: boolean }>({});

    // Initialize map
    useEffect(() => {
        if (mapContainer.current && !mapRef.current) {
            mapRef.current = L.map(mapContainer.current).setView([52.37, 4.89], 13); // Centered on Amsterdam
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);
        }
    }, []);
    
    // Initialize locations and privacy from members
    useEffect(() => {
        if(members) {
            const initialLocations: { [key: number]: any } = {};
            const initialPrivacy: { [key: number]: any } = {};
            members.forEach((member, i) => {
                if(member.id) {
                    initialLocations[member.id] = { lat: 52.37 + (Math.random() - 0.5) * 0.05, lng: 4.89 + (Math.random() - 0.5) * 0.05 };
                    initialPrivacy[member.id] = true; // Everyone shares initially
                }
            });
            setLocations(initialLocations);
            setPrivacy(initialPrivacy);
        }
    }, [members]);

    // Update markers on map
    useEffect(() => {
        if (!mapRef.current || !members) return;

        // Add/update markers
        members.forEach(member => {
            if (!member.id) return;

            const isSharing = privacy[member.id];
            const location = locations[member.id];
            const existingMarker = markersRef.current[member.id];
            
            if (isSharing && location) {
                const customIcon = L.divIcon({
                    html: `<div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white border-2 border-white" style="background-color: ${member.color_hex};">${member.initials}</div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                if (existingMarker) {
                    existingMarker.setLatLng([location.lat, location.lng]);
                } else {
                    markersRef.current[member.id] = L.marker([location.lat, location.lng], { icon: customIcon })
                        .addTo(mapRef.current!)
                        .bindPopup(member.name);
                }
            } else {
                // Remove marker if not sharing
                if (existingMarker) {
                    existingMarker.remove();
                    delete markersRef.current[member.id];
                }
            }
        });
    }, [members, locations, privacy]);

    // Simulate location updates
    useEffect(() => {
        const interval = setInterval(() => {
            setLocations(currentLocations => {
                const newLocations = { ...currentLocations };
                Object.keys(newLocations).forEach(id => {
                    newLocations[Number(id)].lat += (Math.random() - 0.5) * 0.001;
                    newLocations[Number(id)].lng += (Math.random() - 0.5) * 0.001;
                });
                return newLocations;
            });
        }, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const togglePrivacy = (memberId: number) => {
        setPrivacy(p => ({ ...p, [memberId]: !p[memberId] }));
    };

    return (
        <GlassCard>
            <div className="flex items-center space-x-2 mb-3">
                <MapPin className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold">Family Locations</h3>
            </div>
            <div ref={mapContainer} className="h-64 w-full rounded-lg z-0" />
            <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500 dark:text-white/60">Toggle location sharing:</p>
                <div className="flex flex-wrap gap-2">
                {members?.map(member => member.id && (
                    <div key={member.id} className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={privacy[member.id] || false} onChange={() => togglePrivacy(member.id)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-300 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                        </label>
                         <span className="ml-2 text-sm font-medium">{member.name}</span>
                    </div>
                ))}
                </div>
            </div>
        </GlassCard>
    );
};

export default LocationMapWidget;