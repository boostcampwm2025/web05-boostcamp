import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizGameService } from './quiz-game.service';
import { QuizAiService } from './quiz-ai.service';
import { ClovaClientService } from './clova/clova-client.service';
import { QuizRoundStore } from './quiz-round.store';
import { Category, CategoryQuestion, Question } from './entity';
import { QuizSeedService } from './seed';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Category, Question, CategoryQuestion])],
  controllers: [],
  providers: [QuizGameService, QuizAiService, ClovaClientService, QuizRoundStore, QuizSeedService],
})
export class QuizModule {}
