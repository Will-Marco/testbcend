import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  private server: Server;

  private users = new Map();

  handleConnection(client: Socket) {
    console.log(client.id);
  }

  handleDisconnection(client: Socket) {
    for (const [k, v] of this.users) {
      if (client.id === v) {
        this.users.delete(k);
        break;
      }
    }
  }

  @SubscribeMessage('register')
  register(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const id = data.userId;
    const socketId = client.id;

    this.users.set(id, socketId);
    console.log(this.users);
  }

  @SubscribeMessage('join')
  async joinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { group: string },
  ): Promise<void> {
    await client.join(data.group);
  }

  @SubscribeMessage('group-msg')
  handleGroupMsg(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { group: string },
  ) {
    this.server.to(data.group).emit('new', data);
  }

  @SubscribeMessage('private-msg')
  handleMessage(client: Socket, data: { userId: number }) {
    const clientId = data.userId;
    const socketId = this.users.get(client.id) as string;

    if (socketId) {
      this.server.to(socketId).emit('new', { ...data, from: clientId });
    }
  }
}
