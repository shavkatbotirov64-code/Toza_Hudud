declare module './OpenStreetMap.jsx' {
  interface OpenStreetMapProps {
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

  const OpenStreetMap: React.FC<OpenStreetMapProps>
  export default OpenStreetMap
}
