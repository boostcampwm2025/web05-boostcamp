import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ShortAnswerQuestion, Submission } from "../src/quiz/quiz.types";
import { QuizAiService } from "../src/quiz/quiz-ai.service";
import { ClovaClientService } from "../src/quiz/clova/clova-client.service";

describe('QuizAiService 통합 테스트 (실제 AI 채점)', () => {
    let service: QuizAiService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                // 실제 .env 환경변수를 로드합니다. (프로젝트 루트에 .env 파일 필수)
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env',
                }),
            ],
            providers: [
                QuizAiService,
                ClovaClientService, // Mock이 아닌 실제 구현체 사용
            ],
        }).compile();

        service = module.get<QuizAiService>(QuizAiService);
    });

    // AI 응답이 늦을 수 있으므로 타임아웃을 60초로 설정
    it('Clova Studio를 통해 주관식 답안을 정확하게 채점해야 한다', async () => {
        // [Given] 테스트 데이터: HTTP 포트 문제
        const question: ShortAnswerQuestion = {
            type: 'short_answer',
            difficulty: 'medium',
            question: 'HTTP 프로토콜이 사용하는 기본 포트 번호는 무엇인가요?',
            answer: '80', // 모범 답안
            keywords: ['80', '80번'], // 필수 키워드
            explanation: 'HTTP는 TCP 80번 포트를 기본으로 사용합니다.',
        };

        // 다양한 답변 케이스 준비
        const submissions: Submission[] = [
            { playerId: 'user_correct_1', answer: '정답은 80번입니다.' },       // 정답 (문장형)
            { playerId: 'user_correct_2', answer: '80' },                      // 정답 (단답형)
            { playerId: 'user_typo', answer: '80번 포트요' },                  // 정답 (유사)
            { playerId: 'user_wrong_1', answer: '443번입니다.' },             // 오답 (HTTPS)
            { playerId: 'user_wrong_2', answer: '잘 모르겠습니다.' },            // 오답 (회피)
        ];

        console.log('🚀 Clova AI에게 채점 요청 중... (시간이 걸릴 수 있습니다)');

        // [When] 실제 서비스 호출
        const results = await service.gradeSubjectiveQuestion(question, submissions);

        // [Then] 로그 출력 및 검증
        console.log('✅ AI 채점 결과:\n', JSON.stringify(results, null, 2));

        // 모든 제출에 대한 결과가 왔는지
        expect(results).toHaveLength(submissions.length);

        // 정답자 검증 ('user_correct_1')
        const correctUser = results.find((r) => r.playerId === 'user_correct_1');
        expect(correctUser).toBeDefined();
        expect(correctUser?.isCorrect).toBe(true);
        // 피드백이 비어있지 않은지 확인
        expect(correctUser?.feedback?.length).toBeGreaterThan(0);

        // 오답자 검증 ('user_wrong_1')
        const wrongUser = results.find((r) => r.playerId === 'user_wrong_1');
        expect(wrongUser).toBeDefined();
        expect(wrongUser?.isCorrect).toBe(false);

    }, 60000); // Timeout: 60초
});
