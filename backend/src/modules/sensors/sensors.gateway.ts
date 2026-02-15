import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Production'da frontend URL qo'ying
    credentials: true,
  },
})
export class SensorsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SensorsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  // ESP32 dan yangi ma'lumot kelganda chaqiriladi
  emitNewSensorData(data: any) {
    this.logger.log(`📡 Broadcasting sensor data to all clients`);
    this.server.emit('sensorData', data);
  }

  // Quti holati o'zgarganda
  emitBinStatusChange(binId: string, status: 'FULL' | 'EMPTY') {
    this.logger.log(`🗑️ Broadcasting bin status: ${binId} = ${status}`);
    this.server.emit('binStatus', { binId, status });
  }

  // Mashina holati o'zgarganda
  emitVehicleUpdate(vehicleId: string, data: any) {
    this.logger.log(`🚛 Broadcasting vehicle update: ${vehicleId}`);
    this.server.emit('vehicleUpdate', { vehicleId, ...data });
  }
}
