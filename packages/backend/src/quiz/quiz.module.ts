import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClovaClientService } from './clova/clova-client.service';
import { Question } from './entity';
import { QuizGameService } from './quiz-game.service';
import { QuizRoundStore } from './quiz-round.store';
import { QuizService } from './quiz.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Question])],
  controllers: [],
  providers: [QuizGameService, QuizService, ClovaClientService, QuizRoundStore],
})
export class QuizModule {}
