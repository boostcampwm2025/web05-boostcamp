import { forwardRef, Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { MatchService } from './match.service';
import { SessionManager } from './session-manager';
import { GameModule } from '../game/game.module';

@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [MatchGateway, MatchService, SessionManager],
  exports: [SessionManager],
})
export class MatchModule {}
