import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { IMatchQueue, Match } from './interfaces/match-queue.interface';
import { InMemoryMatchQueue } from './queues/in-memory-queue';
import { GameService } from '../game/game.service';
import { UserInfo } from './interfaces/user.interface';

@Injectable()
export class MatchService {
  private matchQueue: IMatchQueue;
  private userToSessionId = new Map<string, string>();

  constructor(@Inject(forwardRef(() => GameService)) private readonly gameService: GameService) {
    this.matchQueue = new InMemoryMatchQueue();
  }

  addToQueue(userId: string, _userInfo: UserInfo): Match | null {
    const sessionId = `session-${userId}-${Date.now()}`;
    this.userToSessionId.set(userId, sessionId);

    return this.matchQueue.add(userId);
  }

  removeFromQueue(userId: string): void {
    this.matchQueue.remove(userId);
    this.userToSessionId.delete(userId);
  }

  getQueueSize(): number {
    return this.matchQueue.getQueueSize();
  }

  getSessionId(userId: string): string | undefined {
    return this.userToSessionId.get(userId);
  }

  startGame(
    roomId: string,
    player1Id: string,
    player1SocketId: string,
    player1Info: UserInfo,
    player2Id: string,
    player2SocketId: string,
    player2Info: UserInfo,
    server: Server,
  ): void {
    this.gameService.createRoom(
      roomId,
      player1Id,
      player1SocketId,
      player1Info,
      player2Id,
      player2SocketId,
      player2Info,
      server,
    );
  }

  handlePlayerDisconnect(roomId: string, userId: string): void {
    this.gameService.handlePlayerDisconnect(roomId, userId);
  }
}
