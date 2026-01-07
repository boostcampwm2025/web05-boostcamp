import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { Question as QuestionEntity } from './entity';
import { ClovaClientService } from './clova/clova-client.service';

describe('QuizService', () => {
  let service: QuizService;

  const mockQuestionRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockClovaClient = {
    callClova: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        {
          provide: getRepositoryToken(QuestionEntity),
          useValue: mockQuestionRepository,
        },
        {
          provide: ClovaClientService,
          useValue: mockClovaClient,
        },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
  });

  describe('generateQuestion', () => {
    it('should return 5 questions from DB', async () => {
      // Mock DB data (multiple choice)
      const mockDbQuestions = [
        {
          id: 1,
          questionType: 'multiple' as const,
          content: 'TCP와 UDP의 차이는?',
          correctAnswer: JSON.stringify({
            options: {
              A: '연결형 vs 비연결형',
              B: '동일함',
              C: '차이 없음',
              D: '모름',
            },
            answer: 'A',
          }),
          difficulty: 2,
          isActive: true,
        },
        {
          id: 2,
          questionType: 'multiple' as const,
          content: 'HTTP와 HTTPS의 차이는?',
          correctAnswer: JSON.stringify({
            options: {
              A: '보안 여부',
              B: '속도',
              C: '포트',
              D: '프로토콜',
            },
            answer: 'A',
          }),
          difficulty: 1,
          isActive: true,
        },
        {
          id: 3,
          questionType: 'short' as const,
          content: '서브쿼리란?',
          correctAnswer: '쿼리 안의 쿼리',
          difficulty: 3,
          isActive: true,
        },
        {
          id: 4,
          questionType: 'essay' as const,
          content: 'B+tree를 설명하세요',
          correctAnswer: 'B+tree는 균형 잡힌 트리 구조입니다.',
          difficulty: 4,
          isActive: true,
        },
        {
          id: 5,
          questionType: 'multiple' as const,
          content: 'DNS의 역할은?',
          correctAnswer: JSON.stringify({
            options: {
              A: '도메인 이름 해석',
              B: '파일 전송',
              C: '메일 전송',
              D: '웹 호스팅',
            },
            answer: 'A',
          }),
          difficulty: 1,
          isActive: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDbQuestions),
      };

      mockQuestionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.generateQuestion();

      expect(result).toHaveLength(5);
      expect(result[0].type).toBe('multiple_choice');
      expect(result[0].question).toBe('TCP와 UDP의 차이는?');
      expect(result[0].difficulty).toBe('easy');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'q.isActive = :isActive',
        { isActive: true },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('RANDOM()');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
    });

    it('should convert difficulty correctly', async () => {
      const mockDbQuestions = [
        {
          id: 1,
          difficulty: 1,
          questionType: 'multiple' as const,
          content: 'Q1',
          correctAnswer: JSON.stringify({
            options: { A: 'A', B: 'B', C: 'C', D: 'D' },
            answer: 'A',
          }),
          isActive: true,
        },
        {
          id: 2,
          difficulty: 3,
          questionType: 'multiple' as const,
          content: 'Q2',
          correctAnswer: JSON.stringify({
            options: { A: 'A', B: 'B', C: 'C', D: 'D' },
            answer: 'B',
          }),
          isActive: true,
        },
        {
          id: 3,
          difficulty: 5,
          questionType: 'multiple' as const,
          content: 'Q3',
          correctAnswer: JSON.stringify({
            options: { A: 'A', B: 'B', C: 'C', D: 'D' },
            answer: 'C',
          }),
          isActive: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDbQuestions),
      };

      mockQuestionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.generateQuestion();

      expect(result[0].difficulty).toBe('easy');
      expect(result[1].difficulty).toBe('medium');
      expect(result[2].difficulty).toBe('hard');
    });

    it('should handle short answer questions', async () => {
      const mockDbQuestions = [
        {
          id: 1,
          questionType: 'short' as const,
          content: '서브쿼리란?',
          correctAnswer: '쿼리 안의 쿼리',
          difficulty: 3,
          isActive: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDbQuestions),
      };

      mockQuestionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.generateQuestion();

      expect(result[0].type).toBe('short_answer');
      if (result[0].type === 'short_answer') {
        expect(result[0].answer).toBe('쿼리 안의 쿼리');
        expect(result[0].keywords).toEqual([]);
      }
    });

    it('should handle essay questions', async () => {
      const mockDbQuestions = [
        {
          id: 1,
          questionType: 'essay' as const,
          content: 'B+tree를 설명하세요',
          correctAnswer: 'B+tree는 균형 잡힌 트리 구조입니다.',
          difficulty: 5,
          isActive: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDbQuestions),
      };

      mockQuestionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.generateQuestion();

      expect(result[0].type).toBe('essay');
      if (result[0].type === 'essay') {
        expect(result[0].sampleAnswer).toBe('B+tree는 균형 잡힌 트리 구조입니다.');
        expect(result[0].keywords).toEqual([]);
      }
    });

    it('should handle null difficulty as medium', async () => {
      const mockDbQuestions = [
        {
          id: 1,
          questionType: 'multiple' as const,
          content: 'Test question',
          correctAnswer: JSON.stringify({
            options: { A: 'A', B: 'B', C: 'C', D: 'D' },
            answer: 'A',
          }),
          difficulty: null,
          isActive: true,
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockDbQuestions),
      };

      mockQuestionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.generateQuestion();

      expect(result[0].difficulty).toBe('medium');
    });
  });
});
