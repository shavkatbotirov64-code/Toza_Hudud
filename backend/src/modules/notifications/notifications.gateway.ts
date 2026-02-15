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
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // Hammaga xabar yuborish
  sendToAll(event: string, data: any) {
    this.logger.log(`📢 Broadcasting to all: ${event}`);
    this.server.emit(event, data);
  }

  // Bitta foydalanuvchiga xabar yuborish
  sendToUser(userId: string, event: string, data: any) {
    this.logger.log(`📨 Sending to user ${userId}: ${event}`);
    this.server.to(userId).emit(event, data);
  }

  // Notification yuborish
  sendNotification(notification: any) {
    if (notification.userId) {
      // Bitta foydalanuvchiga
      this.sendToUser(notification.userId, 'notification', notification);
    } else {
      // Hammaga
      this.sendToAll('notification', notification);
    }
  }
}
