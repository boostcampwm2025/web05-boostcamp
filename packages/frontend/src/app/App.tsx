import { useScene } from '@/feature/useScene';

import Home from '@/pages/home/Home';

export default function App() {
  const { scene } = useScene();

  switch (scene) {
    case 'home':
      return <Home />;
  }

  return <Home />;
}
