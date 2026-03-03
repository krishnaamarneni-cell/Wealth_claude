import { NextRequest, NextResponse } from "next/server"
import WebSocket from "ws"

export async function GET(req: NextRequest) {
  const ships: any[] = []
  const errors: string[] = []
  let ws: WebSocket | null = null

  try {
    // Create WebSocket connection
    ws = new WebSocket("wss://stream.aisstream.io/v0/stream")

    // Set up event handlers
    ws.on("open", () => {
      console.log("[v0] WebSocket connected")

      // Subscribe to English Channel bounding box
      const subscriptionMessage = {
        APIKey: "41b8f108a358a50f74de1fcbb1e852b3efdf2aaa",
        BoundingBoxes: [[[49, -5], [52, 5]]],
      }

      ws!.send(JSON.stringify(subscriptionMessage))
      console.log("[v0] Subscription sent")
    })

    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data)

        // Ships are in the "Ships" array in each message
        if (message.MessageType === "PositionReport" && message.Message) {
          const positionReport = JSON.parse(message.Message)
          if (positionReport.MMSI) {
            ships.push({
              mmsi: positionReport.MMSI,
              name: positionReport.ShipName || "Unknown",
              lat: positionReport.Latitude,
              lon: positionReport.Longitude,
            })
            console.log(`[v0] Ship collected: ${positionReport.ShipName} (${positionReport.MMSI})`)
          }
        }
      } catch (e) {
        errors.push(`Failed to parse message: ${String(e)}`)
      }
    })

    ws.on("error", (err: Error) => {
      console.error("[v0] WebSocket error:", err.message)
      errors.push(`WebSocket error: ${err.message}`)
    })

    // Wait 15 seconds for ships to stream in
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`[v0] 15 second timeout reached. Collected ${ships.length} ships`)
        resolve()
      }, 15000)
    })

    // Close the connection
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }

    return NextResponse.json({
      success: true,
      shipsCollected: ships.length,
      ships: ships.slice(0, 10), // Return first 10 ships as sample
      totalShipsReceived: ships.length,
      errors: errors.length > 0 ? errors : null,
      message: `Successfully connected to AIS stream and collected ${ships.length} ship positions over 15 seconds`,
    })
  } catch (error) {
    console.error("[v0] Test AIS error:", error)

    // Ensure WebSocket is closed
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }

    return NextResponse.json(
      {
        success: false,
        error: String(error),
        shipsCollected: ships.length,
        errors: [...errors, String(error)],
      },
      { status: 500 }
    )
  }
}
