import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuizAiService } from './quiz-ai.service';
import { ClovaClientService } from './clova/clova-client.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [QuizAiService, ClovaClientService],
  exports: [QuizAiService],
})
export class QuizModule {}
