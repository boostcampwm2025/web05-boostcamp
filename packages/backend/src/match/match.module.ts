import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { MatchService } from './match.service';
import { SessionManager } from './session-manager';
import { QuizModule } from '../quiz/quiz.module';

@Module({
  imports: [QuizModule],
  providers: [MatchGateway, MatchService, SessionManager],
  exports: [SessionManager],
})
export class MatchModule {}
