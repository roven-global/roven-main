import { useState, useEffect } from 'react';

interface TypewriterOptions {
  speed?: number;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
}

export const useTypewriter = (words: string[], options: TypewriterOptions = {}) => {
  const { speed = 150, loop = false, deleteSpeed = 50, delay = 1000 } = options;
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleTyping = () => {
      const currentWord = words[wordIndex];
      // If deleting, delete one char
      if (isDeleting) {
        setText((prev) => prev.substring(0, prev.length - 1));
      } else {
        // If typing, add one char
        setText((prev) => currentWord.substring(0, prev.length + 1));
      }

      // Check if word is fully typed
      if (!isDeleting && text === currentWord) {
        // If it is the last word and not looping, stop
        if (!loop && wordIndex === words.length - 1) {
          return;
        }
        // Pause at end of word, then start deleting
        setTimeout(() => setIsDeleting(true), delay);
      } 
      // Check if word is fully deleted
      else if (isDeleting && text === '') {
        setIsDeleting(false);
        // Move to next word
        setWordIndex((prev) => (prev + 1) % words.length);
      }
    };

    const typingSpeed = isDeleting ? deleteSpeed : speed;
    const timeout = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, deleteSpeed, delay, loop]);

  return text;
};
