export type RealtimeUnsubscribe = () => void

export interface RealtimeService {
  connect: (url?: string) => void
  disconnect: () => void
  onConnect: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onDisconnect: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onSensorData: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onBinUpdate: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onBinStatus: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onDispatchAssigned: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onVehicleStateUpdate: (callback: (payload: any) => void) => RealtimeUnsubscribe
  onVehiclePositionUpdate: (callback: (payload: any) => void) => RealtimeUnsubscribe
}

export const realtimeService: RealtimeService
