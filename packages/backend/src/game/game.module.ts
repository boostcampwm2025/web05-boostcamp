import { forwardRef, Module } from '@nestjs/common';
import { GameService } from './game.service';
import { MatchModule } from '../match/match.module';

@Module({
  imports: [forwardRef(() => MatchModule)],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
