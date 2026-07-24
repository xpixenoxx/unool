"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

export type PerspectiveFlipTrigger = "hover" | "click" | "auto";

export interface PerspectiveFlipProps {
  front: React.ReactNode;
  back: React.ReactNode;
  duration?: number;
  trigger?: PerspectiveFlipTrigger;
  className?: string;
  style?: React.CSSProperties;
  perspective?: number;
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
}

export default function PerspectiveFlip({
  front,
  back,
  duration = 0.6,
  trigger = "hover",
  className = "",
  style,
  perspective = 1000,
  isFlipped: controlledFlipped,
  onFlip,
}: PerspectiveFlipProps) {
  const [internalFlipped, setInternalFlipped] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const isControlled = controlledFlipped !== undefined;
  const isFlipped = isControlled ? controlledFlipped : internalFlipped;

  const handleFlip = (flipped: boolean) => {
    if (!isControlled) {
      setInternalFlipped(flipped);
    }
    onFlip?.(flipped);
  };

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      setIsHovered(true);
      handleFlip(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") {
      setIsHovered(false);
      handleFlip(false);
    }
  };

  const handleClick = () => {
    if (trigger === "click") {
      handleFlip(!isFlipped);
    }
  };

  React.useEffect(() => {
    if (trigger === "auto") {
      const interval = setInterval(() => {
        handleFlip(!isFlipped);
      }, duration * 1000 * 3);
      return () => clearInterval(interval);
    }
  }, [trigger, duration, isControlled, isFlipped]);

  const springConfig = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20,
    duration,
  };

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        ...style,
        perspective,
        perspectiveOrigin: "center center",
        cursor: trigger === "click" ? "pointer" : undefined,
      } as React.CSSProperties}
    >
      <AnimatePresence mode="wait">
        {!isFlipped && (
          <motion.div
            key="front"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            exit={{ rotateY: 180 }}
            transition={springConfig}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              transformStyle: "preserve-3d" as const,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden" as const,
                transform: "rotateY(0deg)",
              }}
            >
              {front}
            </div>
          </motion.div>
        )}
        <AnimatePresence mode="wait">
          {isFlipped && (
            <motion.div
              key="back"
              initial={{ rotateY: -180 }}
              animate={{ rotateY: 0 }}
              exit={{ rotateY: 0 }}
              transition={springConfig}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backfaceVisibility: "hidden",
                transformStyle: "preserve-3d" as const,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden" as const,
                  transform: "rotateY(180deg)",
                }}
              >
                {back}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}