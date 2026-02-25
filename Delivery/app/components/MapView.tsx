"use client"

import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import { useEffect, useState, useMemo, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'

// Icon map
const markerIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [40, 40],
    iconAnchor: [15, 46],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

// Định vị icon map
const DraggableMarker = ({ position, setPosition }: {
    position: [number, number],
    setPosition: (position: [number, number]) => void
}) => {
    const map = useMap()

    useEffect(() => {
        map.setView(position as LatLngExpression, 13, { animate: true })
    }, [map, position])

    return (
        <Marker icon={markerIcon} position={position} draggable={true}
            eventHandlers={{
                dragend: (e: L.LeafletEvent) => {
                    const marker = e?.target as L.Marker
                    const { lat, lng } = marker.getLatLng()
                    setPosition([lat, lng])
                }
            }}
        >
            <Popup>
                My current address
            </Popup>
        </Marker>
    )
}

// Xử lý click trên map
const MapClickHandler = ({ position, setPosition, setSearchMap }: {
    position: [number, number],
    setPosition: (position: [number, number]) => void,
    setSearchMap: (map: string) => void
}) => {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.setView(position as LatLngExpression, 13, { animate: true })
        }
    }, [map, position])

    useMapEvents({
        click: (e: L.LeafletMouseEvent) => {
            const { lat, lng } = (e as L.LeafletMouseEvent)?.latlng
            setPosition([lat, lng])
            setSearchMap('')
        }
    })

    return null
}

const MapView = ({ position, setPosition, setSearchMap }:
    {
        position: [number, number] | null,
        setPosition: (position: [number, number]) => void
        setSearchMap: (map: string) => void;
    },
) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!position) return null;

    return (
        <div className='w-full h-full z-9'>
            {mounted && (
                <MapContainer
                    key="map"
                    center={position as LatLngExpression}
                    zoom={13}
                    scrollWheelZoom={true}
                    zoomControl={true}
                    doubleClickZoom={true}
                    dragging={true}
                    touchZoom={true}
                    className='w-full h-[400px]'>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker position={position} setPosition={setPosition} />
                    <MapClickHandler position={position} setPosition={setPosition} setSearchMap={setSearchMap} />
                </MapContainer>
            )}
        </div>
    )
}

export default MapView
