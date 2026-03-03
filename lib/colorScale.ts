"use client"

export const LEGEND_STOPS = [
  { value: -50, color: "#dc2626", label: "-50%" },
  { value: -25, color: "#ef4444", label: "-25%" },
  { value: 0, color: "#6b7280", label: "0%" },
  { value: 25, color: "#22c55e", label: "+25%" },
  { value: 50, color: "#15803d", label: "+50%" },
]

export function pctToColor(pct: number): string {
  if (pct <= -50) return "#dc2626"
  if (pct <= -25) return "#ef4444"
  if (pct < 0) return "#f87171"
  if (pct < 0.1) return "#6b7280"
  if (pct < 25) return "#86efac"
  if (pct < 50) return "#22c55e"
  return "#15803d"
}

export function pctToTextClass(pct: number): string {
  if (pct < 0) return "text-red-500"
  if (pct < 0.1) return "text-gray-500"
  return "text-green-500"
}
