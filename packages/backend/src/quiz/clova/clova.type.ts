export interface ClovaRequestDto {
  systemPrompt: string;
  userPrompt: string;
}

export interface ClovaApiResponse {
  result: {
    message: {
      content: string;
    };
  };
}
