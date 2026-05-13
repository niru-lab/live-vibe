import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import OnboardingOverlay from '@/components/onboarding/OnboardingOverlay';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const AppLayout = ({ children, hideNav = false }: AppLayoutProps) => {
  const location = useLocation();
  const showAppTour = !hideNav && location.state?.startAppTour === true;

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
      {showAppTour && <OnboardingOverlay />}
    </div>
  );
};

