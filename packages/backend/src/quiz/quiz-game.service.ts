import { Injectable } from '@nestjs/common';

import { QuizAiService } from './quiz-ai.service';
import { QuizRoundStore } from './quiz-round.store';
import { RoundData } from './quiz.types';

@Injectable()
export class QuizGameService {
  constructor(
    private readonly store: QuizRoundStore,
    private readonly aiService: QuizAiService,
  ) {}

  // 게임 방 생성 (테스트용)
  createGame(roomId: string, player1Id: string, player2Id: string) {
    return this.store.createSession(roomId, player1Id, player2Id);
  }

  /**
   * 라운드 시작
   */
  async startRound(roomId: string): Promise<RoundData> {
    const roundData = this.store.startNextRound(roomId);

    const questions = await this.aiService.generateQuestion();

    const targetQuestion = questions[(roundData.roundNumber - 1) % questions.length];

    this.store.setQuestion(roomId, targetQuestion);

    return this.store.getRoundData(roomId, roundData.roundNumber);
  }
}
