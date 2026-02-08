import { useState, useEffect, useRef } from 'react';

/**
 * Animated count-up hook with easeOutExpo easing
 * @param end - Target number to count up to
 * @param duration - Animation duration in milliseconds (default 2500)
 * @returns Current animated count value
 */
export function useCountUp(end: number, duration: number = 2500) {
  const [count, setCount] = useState(0);
  const prevEndRef = useRef(0);

  useEffect(() => {
    if (end === prevEndRef.current) return;
    prevEndRef.current = end;
    
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        const t = progress / duration;
        // easeOutExpo easing function
        const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setCount(Math.floor(ease * end));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}
