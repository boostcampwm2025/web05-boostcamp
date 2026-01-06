import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { UserInfo } from '../match/interfaces/user.interface';

@Injectable()
export class GameService {
  createRoom(
    _roomId: string,
    _player1Id: string,
    _player1SocketId: string,
    _player1Info: UserInfo,
    _player2Id: string,
    _player2SocketId: string,
    _player2Info: UserInfo,
    _server: Server,
  ): void {
    // TODO: 게임 로직 구현 예정
  }

  handlePlayerDisconnect(_roomId: string, _userId: string): void {
    // TODO: 연결 해제 처리 구현 예정
  }
}
