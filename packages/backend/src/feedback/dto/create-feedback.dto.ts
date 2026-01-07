import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum FeedbackCategory {
  BUG = 'bug',
  CONTENT = 'content',
  OTHER = 'other',
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackCategory, {
    message: `카테고리는 다음 중 하나여야 합니다: ${Object.values(FeedbackCategory).join(', ')}`,
  })
  @IsNotEmpty({ message: '카테고리는 필수 입력값입니다.' })
  category: FeedbackCategory;

  @IsString({ message: '내용은 문자열 형식이어야 합니다.' })
  @IsNotEmpty({ message: '피드백 내용을 입력해주세요.' })
  content: string;
}
