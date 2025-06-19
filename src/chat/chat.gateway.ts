import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

interface RoomInfo {
  name: string;
  creator: string;
  createdAt: Date;
  isPrivate: boolean;
  password?: string;
  members: Set<string>;
}

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private users = new Map<string, string>(); // userId -> socketId
  private sockets = new Map<string, string>(); // socketId -> userId
  private rooms = new Map<string, RoomInfo>(); // roomName -> RoomInfo

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.sockets.get(client.id);
    this.logger.log(`❌ Cliente desconectado: ${client.id} (Usuario: ${userId || 'Desconocido'})`);

    // Eliminar de usuarios registrados
    if (userId) {
      this.users.delete(userId);
    }
    this.sockets.delete(client.id);

    // Eliminar de todas las salas
    this.rooms.forEach((roomInfo, roomName) => {
      if (roomInfo.members.has(client.id)) {
        this.leaveRoomSilently(client, roomName);
        this.notifyRoomMembers(roomName, `Usuario ${userId || 'Desconocido'} ha dejado la sala (desconectado)`);
      }
    });
  }

  @SubscribeMessage('create-room')
  handleCreateRoom(
    @MessageBody() data: { name: string; isPrivate?: boolean; password?: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { name, isPrivate = false, password } = data;
      const userId = this.sockets.get(client.id) || client.id;

      if (!name) {
        throw new WsException('El nombre de la sala es requerido');
      }

      if (this.rooms.has(name)) {
        throw new WsException('La sala ya existe');
      }

      if (isPrivate && !password) {
        throw new WsException('Las salas privadas requieren contraseña');
      }

      const roomInfo: RoomInfo = {
        name,
        creator: userId,
        createdAt: new Date(),
        isPrivate,
        password,
        members: new Set([client.id]),
      };

      this.rooms.set(name, roomInfo);
      client.join(name);

      this.logger.log(`🏠 Sala creada: ${name} por ${userId} (Privada: ${isPrivate})`);

      // 🔥 AÑADIR ESTA LÍNEA: Emitir room-joined para mantener consistencia
      client.emit('room-joined', {
        room: name,
        message: `Sala creada y te uniste: ${name}`,
        roomInfo: {
          name: roomInfo.name,
          creator: roomInfo.creator,
          isPrivate: roomInfo.isPrivate,
          members: roomInfo.members.size,
          createdAt: roomInfo.createdAt,
        },
      });

      return {
        success: true,
        room: {
          name,
          creator: userId,
          isPrivate,
          members: 1,
          createdAt: roomInfo.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error al crear sala: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    try {
      if (!userId) {
        throw new WsException('🛑 ID de usuario inválido.');
      }

      this.users.set(userId, client.id);
      this.sockets.set(client.id, userId);
      this.logger.log(`📝 Usuario registrado: ${userId} con socket ${client.id}`);
    } catch (error) {
      this.logger.error(`❌ Error al registrar usuario: ${error.message}`);
      throw new WsException(error.message);
    }
  }


  @SubscribeMessage('send-to-user')
  handlePrivateMsg(
    @MessageBody() data: { toUserId: string; message: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { toUserId, message } = data;
      const socketId = this.users.get(toUserId);
      const fromUserId = this.sockets.get(client.id) || client.id;

      if (!socketId) {
        this.logger.warn(`⚠️ Usuario destino no encontrado: ${toUserId}`);
        throw new WsException('Usuario destino no conectado.');
      }

      this.logger.log(`📨 Mensaje privado de ${fromUserId} a ${toUserId}: ${message}`);
      client.to(socketId).emit('private-message', {
        from: fromUserId,
        message,
      });
    } catch (error) {
      this.logger.error(`❌ Error en mensaje privado: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('send-to-all')
  handleBroadcast(@MessageBody() message: string, @ConnectedSocket() client: Socket) {
    try {
      const fromUserId = this.sockets.get(client.id) || client.id;
      this.logger.log(`📢 Broadcast de ${fromUserId}: ${message}`);
      client.broadcast.emit('broadcast-message', {
        from: fromUserId,
        message,
      });
    } catch (error) {
      this.logger.error(`❌ Error en broadcast: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { room: string; password?: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { room, password } = data;
      const userId = this.sockets.get(client.id) || client.id;

      if (!room) {
        throw new WsException('Nombre de sala requerido');
      }

      const roomInfo = this.rooms.get(room);
      if (!roomInfo) {
        throw new WsException('La sala no existe');
      }

      if (roomInfo.isPrivate && roomInfo.password !== password) {
        throw new WsException('Contraseña incorrecta');
      }

      // Verificar si ya está en la sala
      if (roomInfo.members.has(client.id)) {
        throw new WsException('Ya estás en esta sala');
      }

      // Unirse a la sala
      roomInfo.members.add(client.id);
      client.join(room);

      this.logger.log(`🚪 Usuario ${userId} entró a la sala: ${room}`);

      // Notificar al usuario que se unió
      client.emit('room-joined', {
        room,
        message: `Te uniste a la sala ${room}`,
        roomInfo: {
          name: roomInfo.name,
          creator: roomInfo.creator,
          isPrivate: roomInfo.isPrivate,
          members: roomInfo.members.size,
          createdAt: roomInfo.createdAt,
        },
      });

      // Notificar a los demás miembros
      this.notifyRoomMembers(
        room,
        `El usuario ${userId} se unió a la sala`,
        client.id
      );

      return {
        success: true,
        room: {
          name: roomInfo.name,
          creator: roomInfo.creator,
          isPrivate: roomInfo.isPrivate,
          members: roomInfo.members.size,
          createdAt: roomInfo.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Error al unirse a sala: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const userId = this.sockets.get(client.id) || client.id;

      if (!room) {
        throw new WsException('Nombre de sala requerido');
      }

      const roomInfo = this.rooms.get(room);
      if (!roomInfo) {
        throw new WsException('La sala no existe');
      }

      if (!roomInfo.members.has(client.id)) {
        throw new WsException('No estás en esta sala');
      }

      // Salir de la sala
      this.leaveRoomSilently(client, room);

      // Notificar a los demás miembros
      this.notifyRoomMembers(
        room,
        `El usuario ${userId} dejó la sala`,
        client.id
      );

      // Si la sala queda vacía, eliminarla (excepto si es persistente)
      if (roomInfo.members.size === 0) {
        this.rooms.delete(room);
        this.logger.log(`🗑 Sala eliminada por estar vacía: ${room}`);
      }

      return { success: true, room };
    } catch (error) {
      this.logger.error(`❌ Error al salir de sala: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('list-rooms')
  handleListRooms(@ConnectedSocket() client: Socket) {
    try {
      const publicRooms = Array.from(this.rooms.values())
        .filter(room => !room.isPrivate)
        .map(room => ({
          name: room.name,
          creator: room.creator,
          members: room.members.size,
          createdAt: room.createdAt,
        }));

      client.emit('room-list', publicRooms);
      return { success: true, rooms: publicRooms };
    } catch (error) {
      this.logger.error(`❌ Error al listar salas: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('room-members')
  handleRoomMembers(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket
  ) {
    try {
      if (!room) {
        throw new WsException('Nombre de sala requerido');
      }

      const roomInfo = this.rooms.get(room);
      if (!roomInfo) {
        throw new WsException('La sala no existe');
      }

      if (!roomInfo.members.has(client.id)) {
        throw new WsException('No tienes acceso a esta sala');
      }

      const members = Array.from(roomInfo.members)
        .map(socketId => this.sockets.get(socketId) || socketId);

      client.emit('room-members-list', {
        room,
        members,
        count: members.length,
      });

      return { success: true, room, members };
    } catch (error) {
      this.logger.error(`❌ Error al obtener miembros: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  @SubscribeMessage('send-to-room')
  handleRoomMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { room, message } = data;
      const userId = this.sockets.get(client.id) || client.id;

      if (!room || !message) {
        throw new WsException('Datos incompletos para enviar a sala');
      }

      const roomInfo = this.rooms.get(room);
      if (!roomInfo) {
        throw new WsException('La sala no existe');
      }

      if (!roomInfo.members.has(client.id)) {
        throw new WsException('No estás en esta sala');
      }

      this.logger.log(`💬 [${room}] ${userId}: ${message}`);

      // Enviar mensaje a todos en la sala (incluyendo al remitente)
      this.server.to(room).emit('room-message', {
        from: userId,
        room,
        message,
        timestamp: new Date(),
      });

      return { success: true, room, message };
    } catch (error) {
      this.logger.error(`❌ Error enviando a sala: ${error.message}`);
      throw new WsException(error.message);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private leaveRoomSilently(client: Socket, room: string) {
    const roomInfo = this.rooms.get(room);
    if (roomInfo) {
      roomInfo.members.delete(client.id);
      client.leave(room);
      this.logger.log(`👋 Usuario ${client.id} salió de la sala: ${room}`);
    }
  }

  private notifyRoomMembers(room: string, message: string, excludeSocketId?: string) {
    const roomInfo = this.rooms.get(room);
    if (!roomInfo) return;

    const payload = {
      from: 'Sistema',
      room,
      message,
      timestamp: new Date(),
    };

    if (excludeSocketId) {
      this.server.to(room).except(excludeSocketId).emit('room-notification', payload);
    } else {
      this.server.to(room).emit('room-notification', payload);
    }
  }
}
