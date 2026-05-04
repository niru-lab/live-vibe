import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  stepKey: string | number;
  direction: 1 | -1;
  children: ReactNode;
}

export default function StepTransition({ stepKey, direction, children }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        initial={{ x: direction * 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction * -32, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
