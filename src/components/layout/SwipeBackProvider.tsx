import { useLocation } from 'react-router-dom';
import { useSwipeBack } from '@/hooks/useSwipeBack';

// Tab roots — kein Swipe-Back (sonst landet man im Auth-Flow / nirgendwo).
const TAB_ROUTES = new Set(['/', '/discover', '/roomz', '/events', '/messages', '/profile']);

// Auth/Onboarding — explizit kein Swipe-Back.
const NO_SWIPE_PREFIXES = ['/auth', '/register', '/verify', '/onboarding'];

export const SwipeBackProvider = () => {
  const { pathname } = useLocation();
  const isTabRoot = TAB_ROUTES.has(pathname);
  const isAuth = NO_SWIPE_PREFIXES.some((p) => pathname.startsWith(p));
  useSwipeBack({ disabled: isTabRoot || isAuth });
  return null;
};
