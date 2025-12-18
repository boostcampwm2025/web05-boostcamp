import { useEffect, useState } from 'react';

type MatchState = 'matching' | 'preparing' | 'playing' | 'round-result';

export function useMatch() {
  const [matchState, setMatchState] = useState<MatchState>('matching');

  useEffect(() => {
    // TODO: 마운트 시 소켓 연결
    // socket.connect();

    // TODO: 언마운트 시 소켓 정리
    return () => {
      // socket.disconnect();
    };
  }, []);

  // TODO: 헨들링 함수 export 부분 제거
  return { matchState, setMatchState };
}
