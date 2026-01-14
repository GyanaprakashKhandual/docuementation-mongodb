import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { positionClasses, calculatePosition } from '../scripts/Tooltip.context';

export const Tooltip = ({
  content = '',
  children,
  position = 'top',
  delay = 0,
  maxWidth = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [calculatedPosition, setCalculatedPosition] = useState(position);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const newPosition = calculatePosition(trigger, tooltip, position);
      setCalculatedPosition(newPosition);
    }
  }, [isVisible, position]);

  const animationVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div
        ref={triggerRef}
        className="flex items-center justify-center"
        onMouseEnter={() => setTimeout(() => setIsVisible(true), delay)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={animationVariants}
            transition={{ duration: 0.2 }}
            className={`
              absolute z-50 bg-[#3c4043] text-white text-[13px] leading-4.5 px-2.5 py-1.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.26)] whitespace-nowrap font-semibold pointer-events-none border-0
              ${positionClasses[calculatedPosition] || positionClasses.top}
            `}
            style={{ maxWidth: `${maxWidth}px` }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};