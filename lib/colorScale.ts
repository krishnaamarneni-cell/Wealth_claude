// Color scaling utilities for percentage changes
export const LEGEND_STOPS = [
  { value: -10, color: "#8B0000" },     // Dark red
  { value: -5, color: "#DC143C" },      // Crimson
  { value: -2, color: "#FF6347" },      // Tomato
  { value: 0, color: "#808080" },       // Gray
  { value: 2, color: "#90EE90" },       // Light green
  { value: 5, color: "#32CD32" },       // Lime green
  { value: 10, color: "#006400" },      // Dark green
]

export function pctToColor(pct: number | undefined): string {
  if (pct === undefined || pct === null) return "#808080"
  if (pct >= 10) return "#006400"
  if (pct >= 5) return "#32CD32"
  if (pct >= 2) return "#90EE90"
  if (pct > -2) return "#808080"
  if (pct >= -5) return "#FF6347"
  if (pct >= -10) return "#DC143C"
  return "#8B0000"
}

export function pctToTextClass(pct: number | undefined): string {
  if (pct === undefined || pct === null) return "text-gray-400"
  if (pct > 0) return "text-green-400"
  if (pct < 0) return "text-red-400"
  return "text-gray-400"
}
