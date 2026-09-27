import { useState, useEffect } from 'react';

export function useTypewriter(text: string, enabled: boolean = true) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    const totalChars = text.length;
    // 40ms per char capped at max 1500ms total duration
    const charDelay = Math.min(40, Math.floor(1500 / Math.max(1, totalChars)));

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      setDisplayedText(text.slice(0, currentIndex));
      if (currentIndex >= totalChars) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, charDelay);

    return () => clearInterval(interval);
  }, [text, enabled]);

  return { displayedText, isTyping };
}
