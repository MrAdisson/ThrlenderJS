import { useEffect, useRef } from 'react';
import { mountEditor } from './mountEditor';

export function App() {
  const editorHost = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = editorHost.current;
    if (host) return mountEditor(host);
  }, []);

  return <div ref={editorHost} />;
}
