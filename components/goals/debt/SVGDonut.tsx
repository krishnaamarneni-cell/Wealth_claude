"use client"

import React from "react"

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface SVGDonutProps {
  segments: DonutSegment[]
  centerLabel?: string
  centerValue?: string
  centerSublabel?: string
  size?: number
  strokeWidth?: number
}

export function SVGDonut({
  segments,
  centerLabel,
  centerValue,
  centerSublabel,
  size = 180,
  strokeWidth = 28,
}: SVGDonutProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return (
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel && (
            <p className="text-[10px] text-muted-foreground">{centerLabel}</p>
          )}
          <p className="text-lg font-bold text-foreground">$0</p>
        </div>
      </div>
    )
  }

  let cumulativePercent = 0

  const arcs = segments
    .filter((s) => s.value > 0)
    .map((segment) => {
      const percent = segment.value / total
      const offset = circumference * (1 - percent)
      const rotation = cumulativePercent * 360

      cumulativePercent += percent

      return {
        ...segment,
        percent,
        strokeDasharray: `${circumference * percent} ${circumference * (1 - percent)}`,
        strokeDashoffset: 0,
        rotation: rotation - 90, // Start from top (12 o'clock)
      }
    })

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1f2937"
          strokeWidth={strokeWidth}
        />
        {/* Segment arcs */}
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeDasharray={arc.strokeDasharray}
            strokeLinecap="butt"
            transform={`rotate(${arc.rotation} ${center} ${center})`}
            className="transition-all duration-500"
          />
        ))}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel && (
          <p className="text-[10px] text-muted-foreground leading-tight">
            {centerLabel}
          </p>
        )}
        {centerValue && (
          <p className="text-lg font-bold text-foreground leading-tight">
            {centerValue}
          </p>
        )}
        {centerSublabel && (
          <p className="text-[10px] text-muted-foreground leading-tight">
            {centerSublabel}
          </p>
        )}
      </div>
    </div>
  )
}
