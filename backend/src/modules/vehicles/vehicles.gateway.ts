import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class VehiclesGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VehiclesGateway.name);

  // Mashina pozitsiyasi yangilanganda barcha clientlarga yuborish
  broadcastVehiclePosition(vehicleId: string, latitude: number, longitude: number) {
    this.server.emit('vehiclePositionUpdate', {
      vehicleId,
      latitude,
      longitude,
      timestamp: new Date()
    });
    this.logger.log(`📡 Broadcasting position for ${vehicleId}: [${latitude}, ${longitude}]`);
  }

  // Mashina holati o'zgarganda barcha clientlarga yuborish
  broadcastVehicleState(vehicleId: string, state: any) {
    this.server.emit('vehicleStateUpdate', {
      vehicleId,
      ...state,
      timestamp: new Date()
    });
    this.logger.log(`📡 Broadcasting state for ${vehicleId}:`, state);
  }
}
