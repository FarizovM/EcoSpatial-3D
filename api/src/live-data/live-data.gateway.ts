import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CreateMeasurementsDto } from '../sensors/dto/create-measurements.dto';

// Налаштовуємо CORS, щоб React міг без проблем підключитися
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveDataGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveDataGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Клієнт підключився: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Клієнт відключився: ${client.id}`);
  }

  // Метод, який ми будемо викликати з нашого генератора
  broadcastNewMeasurements(measurements: CreateMeasurementsDto[]) {
    // Відправляємо подію 'measurements_update' всім підключеним клієнтам
    this.server.emit('measurements_update', measurements);
  }

  @OnEvent('measurements.new')
  handleNewMeasurements(measurements: CreateMeasurementsDto[]) {
    this.broadcastNewMeasurements(measurements);
  }
}