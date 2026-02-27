import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareNetwork, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LevelUpAnimationProps { show: boolean; onClose: () => void; badgeName: string; badgeEmoji: string; badgeColor: string; bonusPoints: number; }

export const LevelUpAnimation = ({ show, onClose, badgeName, badgeEmoji, badgeColor, bonusPoints }: LevelUpAnimationProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i, x: Math.random() * 100, delay: Math.random() * 0.5,
        color: ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7', '#f97316'][Math.floor(Math.random() * 5)],
      }));
      setConfetti(particles);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
          {confetti.map((particle) => (
            <motion.div key={particle.id} initial={{ y: -20, x: `${particle.x}vw`, opacity: 1 }} animate={{ y: '100vh', opacity: 0 }} transition={{ duration: 2, delay: particle.delay, ease: 'easeOut' }} className="absolute top-0 h-3 w-3 rounded-full" style={{ backgroundColor: particle.color }} />
          ))}
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}><X weight="thin" className="h-5 w-5" /></Button>
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }} className="text-center">
            <motion.div animate={{ boxShadow: ['0 0 20px rgba(255,215,0,0.5)', '0 0 60px rgba(255,215,0,0.8)', '0 0 20px rgba(255,215,0,0.5)'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 text-7xl">{badgeEmoji}</motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <p className="mb-2 text-lg text-muted-foreground">🎉 LEVEL UP!</p>
              <h2 className={cn('mb-4 text-3xl font-bold', badgeColor)}>{badgeName} UNLOCKED!</h2>
              <p className="mb-6 text-lg text-foreground">+{bonusPoints.toLocaleString()} Social Cloud Bonus</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" className="gap-2" onClick={onClose}><ShareNetwork weight="thin" className="h-4 w-4" />Teilen</Button>
                <Button onClick={onClose}>Weiter feiern! 🎉</Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
