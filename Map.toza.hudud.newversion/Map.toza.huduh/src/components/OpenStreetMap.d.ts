import type { FC } from 'react'

export interface OpenStreetMapProps {
  center?: [number, number]
  zoom?: number
  style?: string
  bins?: any[]
  vehicles?: any[]
  onBinClick?: (bin: any) => void
  onVehicleClick?: (vehicle: any) => void
  showControls?: boolean
  height?: string
}

declare const OpenStreetMap: FC<OpenStreetMapProps>
export default OpenStreetMap
