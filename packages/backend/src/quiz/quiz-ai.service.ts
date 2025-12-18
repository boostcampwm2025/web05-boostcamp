import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { ClovaClientService } from './clova/clova-client.service';
import { QUIZ_PROMPTS } from './quiz-prompts';
import { Question } from './quiz.types';

@Injectable()
export class QuizAiService {
  private readonly logger = new Logger(QuizAiService.name);

  constructor(private readonly clovaClient: ClovaClientService) {}

  // 문제 생성 (5문제 배열 반환)
  async generateQuestion(): Promise<Question[]> {
    const rawContent = await this.clovaClient.callClova({
      systemPrompt: QUIZ_PROMPTS.GENERATOR,
    });

    return this.parseJsonSafely<Question[]>(rawContent);
  }

  /**
   * - AI가 배열([])을 안 주고 객체({}) 여러 개를 줬을 때도 처리
   */
  private parseJsonSafely<T>(text: string): T {
    try {
      // 1. 마크다운 및 불필요한 공백 제거
      const cleanText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // 먼저 전체가 올바른 JSON(배열 혹은 객체)인지 시도
      try {
        return JSON.parse(cleanText) as T;
      } catch {
        // 실패했다면? AI가 "{...} --- {...}" 식으로 줬을 가능성이 큼
        // 정규식으로 중괄호 묶음 { ... } 을 모두 찾음
        const matchRegex = /\{[\s\S]*?}/g;
        const matches = cleanText.match(matchRegex);

        if (!matches || matches.length === 0) {
          throw new Error('JSON 패턴을 찾을 수 없습니다.');
        }

        // 찾은 조각들을 각각 파싱해서 배열로 합침
        const parsedObjects = matches.map((str) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return JSON.parse(str);
        });

        // T가 배열 타입이라면 배열 반환, 아니면 첫 번째 객체 반환 (단일 객체 요청 시)
        // 상황에 따라 타입 캐스팅 처리
        if (parsedObjects.length === 1) {
          return parsedObjects[0] as T;
        }

        return parsedObjects as unknown as T;
      }
    } catch (error) {
      this.logger.error(`AI JSON Parsing Error: ${text}`, error);

      throw new InternalServerErrorException('AI 응답을 처리할 수 없습니다.');
    }
  }
}
