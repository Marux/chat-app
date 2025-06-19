import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { WsException } from '@nestjs/websockets';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  const mockClient: any = {
    id: 'mockSocketId',
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    broadcast: {
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleRegister', () => {
    it('debería registrar correctamente un usuario', () => {
      const userId = '123';
      gateway.handleRegister(userId, mockClient);
      expect((gateway as any).users.get(userId)).toBe(mockClient.id);
      expect((gateway as any).sockets.get(mockClient.id)).toBe(userId);
    });

    it('debería lanzar una excepción si el userId es inválido', () => {
      expect(() => gateway.handleRegister('', mockClient)).toThrow(WsException);
    });
  });

  describe('handlePrivateMsg', () => {
    it('debería enviar un mensaje privado si el usuario está registrado', () => {
      const fromUserId = 'user1';
      const toUserId = 'user2';
      const toSocketId = 'socket2';

      // Prepara los mapas internos
      (gateway as any).sockets.set(mockClient.id, fromUserId);
      (gateway as any).users.set(toUserId, toSocketId);

      const data = { toUserId, message: 'Hola' };

      gateway.handlePrivateMsg(data, mockClient);

      expect(mockClient.to).toHaveBeenCalledWith(toSocketId);
      expect(mockClient.to(toSocketId).emit).toHaveBeenCalledWith('private-message', {
        from: fromUserId,
        message: 'Hola',
      });
    });

    it('debería lanzar una excepción si el destinatario no existe', () => {
      const data = { toUserId: 'no-existe', message: 'Hola' };
      expect(() => gateway.handlePrivateMsg(data, mockClient)).toThrow(WsException);
    });
  });

  describe('handleBroadcast', () => {
    it('debería emitir un broadcast a todos menos el emisor', () => {
      const userId = 'user3';
      (gateway as any).sockets.set(mockClient.id, userId);

      gateway.handleBroadcast('Mensaje global', mockClient);

      expect(mockClient.broadcast.emit).toHaveBeenCalledWith('broadcast-message', {
        from: userId,
        message: 'Mensaje global',
      });
    });
  });
});
