import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const AppLayout = ({ children, hideNav = false }: AppLayoutProps) => {
  return (
    <div
      className="bg-background w-full"
      style={{ minHeight: '100dvh' }}
    >
      <main
        className={hideNav ? '' : 'pb-[calc(96px+env(safe-area-inset-bottom))]'}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};
