import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SensorsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SensorsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitSensorData(data: any) {
    this.logger.log('Broadcasting sensorData event');
    this.server.emit('sensorData', data);
  }

  emitBinStatusChange(binId: string, status: 'FULL' | 'EMPTY') {
    this.logger.log(`Broadcasting binStatus: ${binId} -> ${status}`);
    this.server.emit('binStatus', { binId, status });
  }

  emitBinUpdate(payload: any) {
    this.logger.log(`Broadcasting binUpdate: ${payload?.binId || payload?.id || 'unknown-bin'}`);
    this.server.emit('binUpdate', payload);
  }

  emitVehicleStateUpdate(payload: any) {
    this.logger.log(`Broadcasting vehicleStateUpdate: ${payload?.vehicleId || 'unknown-vehicle'}`);
    this.server.emit('vehicleStateUpdate', payload);
  }

  emitVehiclePositionUpdate(payload: any) {
    this.logger.log(`Broadcasting vehiclePositionUpdate: ${payload?.vehicleId || 'unknown-vehicle'}`);
    this.server.emit('vehiclePositionUpdate', payload);
  }

  emitDispatchAssigned(payload: any) {
    this.logger.log(
      `Broadcasting dispatchAssigned: ${payload?.vehicleId || 'unknown-vehicle'} -> ${payload?.binId || 'unknown-bin'}`,
    );
    this.server.emit('dispatchAssigned', payload);
  }

  // Backward compatibility
  emitNewSensorData(data: any) {
    this.emitSensorData(data);
  }

  emitVehicleUpdate(vehicleId: string, data: any) {
    this.emitVehicleStateUpdate({ vehicleId, ...data });
  }
}
