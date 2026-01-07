import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClovaClientService } from './clova/clova-client.service';
import { Question as QuestionEntity } from './entity';
import { QUIZ_CONSTANTS, QUIZ_ERROR_MESSAGES, QUIZ_LOG_MESSAGES } from './quiz.constants';
import { QUIZ_PROMPTS } from './quiz-prompts';
import {
  Difficulty,
  EssayQuestion,
  MultipleChoiceQuestion,
  Question,
  RoundResult,
  ShortAnswerQuestion,
  Submission,
} from './quiz.types';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly clovaClient: ClovaClientService,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
  ) {}

  /**
   * 문제 생성
   * - DB에서 랜덤하게 5개 질문을 조회합니다.
   * @throws {InternalServerErrorException} DB에 충분한 질문이 없거나 변환 중 오류 발생 시
   */
  async generateQuestion(): Promise<Question[]> {
    // 1. DB에서 활성화된 질문 랜덤 5개 조회
    const dbQuestions = await this.questionRepository
      .createQueryBuilder('q')
      .where('q.isActive = :isActive', { isActive: true })
      .orderBy('RANDOM()')
      .limit(QUIZ_CONSTANTS.REQUIRED_QUESTION_COUNT)
      .getMany();

    // 2. 질문 개수 검증
    if (dbQuestions.length < QUIZ_CONSTANTS.REQUIRED_QUESTION_COUNT) {
      this.logger.error(
        QUIZ_LOG_MESSAGES.INSUFFICIENT_QUESTIONS(
          dbQuestions.length,
          QUIZ_CONSTANTS.REQUIRED_QUESTION_COUNT,
        ),
      );

      throw new InternalServerErrorException(
        QUIZ_ERROR_MESSAGES.INSUFFICIENT_QUESTIONS(
          dbQuestions.length,
          QUIZ_CONSTANTS.REQUIRED_QUESTION_COUNT,
        ),
      );
    }

    // 3. Entity -> quiz.types.ts 타입으로 변환
    try {
      return dbQuestions.map((q) => this.convertToQuizType(q));
    } catch (error) {
      this.logger.error(QUIZ_LOG_MESSAGES.CONVERSION_ERROR(error as Error));

      throw new InternalServerErrorException(QUIZ_ERROR_MESSAGES.CONVERSION_ERROR);
    }
  }

  /**
   * QuestionEntity를 quiz.types.ts의 Question 타입으로 변환
   * @throws {Error} JSON 파싱 실패 또는 유효하지 않은 데이터 형식
   */
  private convertToQuizType(entity: QuestionEntity): Question {
    const base = {
      question: entity.content,
      difficulty: this.mapDifficulty(entity.difficulty),
      explanation: QUIZ_CONSTANTS.DEFAULT_EXPLANATION,
    };

    // questionType에 따라 분기
    if (entity.questionType === 'multiple') {
      try {
        const parsed = JSON.parse(entity.correctAnswer) as {
          options: { A: string; B: string; C: string; D: string };
          answer: 'A' | 'B' | 'C' | 'D';
        };

        // 파싱된 데이터 검증
        if (!parsed.options || !parsed.answer) {
          throw new Error(QUIZ_ERROR_MESSAGES.MULTIPLE_CHOICE_FORMAT_ERROR);
        }

        return {
          ...base,
          type: 'multiple_choice',
          options: parsed.options,
          answer: parsed.answer,
        } as MultipleChoiceQuestion;
      } catch (error) {
        this.logger.error(
          QUIZ_LOG_MESSAGES.MULTIPLE_CHOICE_CONVERSION_FAILED(entity.id, (error as Error).message),
        );

        throw new Error(QUIZ_ERROR_MESSAGES.MULTIPLE_CHOICE_PARSE_ERROR(entity.id));
      }
    } else if (entity.questionType === 'short') {
      if (!entity.correctAnswer) {
        this.logger.error(QUIZ_LOG_MESSAGES.SHORT_ANSWER_MISSING(entity.id));

        throw new Error(QUIZ_ERROR_MESSAGES.SHORT_ANSWER_MISSING(entity.id));
      }

      return {
        ...base,
        type: 'short_answer',
        answer: entity.correctAnswer,
        keywords: QUIZ_CONSTANTS.DEFAULT_KEYWORDS,
      } as ShortAnswerQuestion;
    } else {
      // essay
      if (!entity.correctAnswer) {
        this.logger.error(QUIZ_LOG_MESSAGES.ESSAY_ANSWER_MISSING(entity.id));

        throw new Error(QUIZ_ERROR_MESSAGES.ESSAY_ANSWER_MISSING(entity.id));
      }

      return {
        ...base,
        type: 'essay',
        sampleAnswer: entity.correctAnswer,
        keywords: QUIZ_CONSTANTS.DEFAULT_KEYWORDS,
      } as EssayQuestion;
    }
  }

  /**
   * 숫자 난이도를 문자열 난이도로 매핑
   * 1-2: easy, 3: medium, 4-5: hard
   */
  private mapDifficulty(numDifficulty: number | null): Difficulty {
    if (!numDifficulty) {
      return 'medium';
    }

    if (numDifficulty <= 2) {
      return 'easy';
    }

    if (numDifficulty === 3) {
      return 'medium';
    }

    return 'hard';
  }

  /**
   * 채점
   * - RoundResult 타입에 맞는 스키마를 전달합니다.
   */
  async gradeRound(question: Question, submissions: Submission[]): Promise<RoundResult> {
    const answer =
      'answer' in question
        ? (question as { answer: string }).answer
        : (question as unknown as { sampleAnswer: string }).sampleAnswer || '';

    // 1. 채점 결과 스키마
    const schema = {
      type: 'object',
      properties: {
        roundNumber: { type: 'number' },
        grades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              playerId: { type: 'string' },
              answer: { type: 'string' },
              isCorrect: { type: 'boolean' },
              score: { type: 'number' },
              feedback: {
                type: 'string',
                description: '플레이어별 맞춤 피드백 (정답 칭찬 또는 오답 원인 설명)',
              },
            },
            required: ['playerId', 'answer', 'isCorrect', 'score', 'feedback'],
          },
        },
      },
      required: ['roundNumber', 'grades'],
    };

    const userMessage = `
    [문제] ${question.question}
    [정답] ${answer}
    [제출 답안 목록] ${JSON.stringify(submissions)}
    
    위 데이터를 바탕으로 채점해줘.
  `;

    return await this.clovaClient.callClova<RoundResult>({
      systemPrompt: QUIZ_PROMPTS.GRADER,
      userMessage: userMessage,
      jsonSchema: schema,
    });
  }
}
