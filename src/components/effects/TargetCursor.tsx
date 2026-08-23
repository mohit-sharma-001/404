import React, { useEffect, useState } from 'react';

export interface TargetCursorProps {
  color?: string;
  targetSelector?: string;
}

export const TargetCursor: React.FC<TargetCursorProps> = ({
  color = '#20D4E8',
  targetSelector = 'button, a, input, select, textarea, [role="button"], .cursor-pointer',
}) => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [targetPos, setTargetPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if touch device / mobile screen
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsMobile(true);
    }

    const handleMouseMove = (e: MouseEvent) => {
      setTargetPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      const interactiveEl = target?.closest(targetSelector);

      if (interactiveEl) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible, targetSelector]);

  // Smooth position lerp loop
  useEffect(() => {
    if (isMobile) return;

    let animFrame: number;
    const lerp = () => {
      setPosition((prev) => ({
        x: prev.x + (targetPos.x - prev.x) * 0.22,
        y: prev.y + (targetPos.y - prev.y) * 0.22,
      }));
      animFrame = requestAnimationFrame(lerp);
    };

    animFrame = requestAnimationFrame(lerp);
    return () => cancelAnimationFrame(animFrame);
  }, [targetPos, isMobile]);

  if (isMobile || !isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50 transition-opacity duration-300"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Center Target Dot */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200"
        style={{
          width: isHovered ? '8px' : '4px',
          height: isHovered ? '8px' : '4px',
          backgroundColor: color,
          boxShadow: isHovered ? `0 0 10px ${color}` : 'none',
        }}
      />

      {/* Target Reticle Outer Bracket Lines */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out rounded-sm border"
        style={{
          width: isHovered ? '36px' : '22px',
          height: isHovered ? '36px' : '22px',
          borderColor: isHovered ? color : 'rgba(148, 163, 184, 0.4)',
          transform: `translate3d(-50%, -50%, 0) rotate(${isHovered ? '45deg' : '0deg'})`,
        }}
      />

      {/* Target Acquisition Ring */}
      {isHovered && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border opacity-50 animate-ping"
          style={{ borderColor: color }}
        />
      )}
    </div>
  );
};
