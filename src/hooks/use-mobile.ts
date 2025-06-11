import { useEffect, useState } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized
 * @returns {boolean} True if the viewport width is less than 768px (md breakpoint in Tailwind)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint in Tailwind
    };
    
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}