import { NextResponse } from "next/server"

// Major world shipping routes as start/end coordinates
const SHIPPING_ROUTES = [
  // Trans-Pacific
  { name: "Trans-Pacific (Asia→USA)", startLat: 35.6, startLng: 139.7, endLat: 37.8, endLng: -122.4 },
  { name: "Trans-Pacific (China→USA)", startLat: 22.3, startLng: 114.2, endLat: 33.7, endLng: -118.2 },
  { name: "Trans-Pacific (China→Canada)", startLat: 31.2, startLng: 121.5, endLat: 49.3, endLng: -123.1 },

  // Trans-Atlantic
  { name: "Trans-Atlantic (UK→USA)", startLat: 51.5, startLng: -0.1, endLat: 40.7, endLng: -74.0 },
  { name: "Trans-Atlantic (Germany→USA)", startLat: 53.5, startLng: 9.9, endLat: 40.7, endLng: -74.0 },
  { name: "Trans-Atlantic (France→Canada)", startLat: 47.3, startLng: -2.2, endLat: 45.5, endLng: -73.6 },

  // Europe ↔ Asia via Suez
  { name: "Suez Route (Europe→Asia)", startLat: 51.5, startLng: -0.1, endLat: 1.3, endLng: 103.8 },
  { name: "Suez Route (Rotterdam→Mumbai)", startLat: 51.9, startLng: 4.5, endLat: 19.1, endLng: 72.9 },
  { name: "Suez Route (Europe→China)", startLat: 43.3, startLng: 5.4, endLat: 22.3, endLng: 114.2 },
  { name: "Suez Route (Europe→Japan)", startLat: 51.9, startLng: 4.5, endLat: 35.6, endLng: 139.7 },

  // Cape of Good Hope
  { name: "Cape Route (Asia→Europe)", startLat: 22.3, startLng: 114.2, endLat: 51.9, endLng: 4.5 },
  { name: "Cape Route (Brazil→Europe)", startLat: -23.0, startLng: -43.2, endLat: 51.5, endLng: -0.1 },

  // Intra-Asia
  { name: "China→Japan", startLat: 31.2, startLng: 121.5, endLat: 35.6, endLng: 139.7 },
  { name: "China→Korea", startLat: 31.2, startLng: 121.5, endLat: 37.5, endLng: 126.9 },
  { name: "China→Singapore", startLat: 22.3, startLng: 114.2, endLat: 1.3, endLng: 103.8 },
  { name: "Singapore→India", startLat: 1.3, startLng: 103.8, endLat: 13.1, endLng: 80.3 },
  { name: "Japan→Korea", startLat: 35.6, startLng: 139.7, endLat: 37.5, endLng: 126.9 },
  { name: "Singapore→Australia", startLat: 1.3, startLng: 103.8, endLat: -33.9, endLng: 151.2 },

  // Americas
  { name: "USA→Brazil", startLat: 29.8, startLng: -95.4, endLat: -23.0, endLng: -43.2 },
  { name: "Panama Canal (Pacific→Atlantic)", startLat: 33.7, startLng: -118.2, endLat: 40.7, endLng: -74.0 },
  { name: "USA East→Europe", startLat: 40.7, startLng: -74.0, endLat: 51.5, endLng: -0.1 },
  { name: "Gulf of Mexico→Europe", startLat: 29.8, startLng: -95.4, endLat: 51.9, endLng: 4.5 },

  // Middle East & Africa
  { name: "Persian Gulf→Asia", startLat: 25.3, startLng: 55.4, endLat: 22.3, endLng: 114.2 },
  { name: "Persian Gulf→Europe", startLat: 25.3, startLng: 55.4, endLat: 51.9, endLng: 4.5 },
  { name: "Persian Gulf→USA", startLat: 25.3, startLng: 55.4, endLat: 29.8, endLng: -95.4 },
  { name: "West Africa→Europe", startLat: 6.4, startLng: 3.4, endLat: 51.5, endLng: -0.1 },
  { name: "West Africa→USA", startLat: 6.4, startLng: 3.4, endLat: 29.8, endLng: -95.4 },

  // Australia & Pacific
  { name: "Australia→China", startLat: -33.9, startLng: 151.2, endLat: 31.2, endLng: 121.5 },
  { name: "Australia→Japan", startLat: -33.9, startLng: 151.2, endLat: 35.6, endLng: 139.7 },
  { name: "Australia→Middle East", startLat: -31.9, startLng: 115.9, endLat: 25.3, endLng: 55.4 },
]

export async function GET() {
  return NextResponse.json({
    routes: SHIPPING_ROUTES,
    count: SHIPPING_ROUTES.length,
  }, {
    headers: { "Cache-Control": "public, s-maxage=86400" }
  })
}