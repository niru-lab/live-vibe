import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { resolvePostAuthRoute } from '@/lib/authRouting';

/**
 * Global handler for auth links.
 *
 * Supabase may deliver the session on ANY route (e.g. when the email link
 * falls back to the configured Site URL instead of `/verify`). This component
 * picks up `?code=`, `?token_hash=` or `#access_token=` on every route,
 * establishes the session, cleans the URL and forwards the user into the
 * role / onboarding flow.
 *
 * It also makes sure an already signed-in user never gets stuck on the public
 * auth screens.
 */
const PUBLIC_AUTH_PATHS = ['/', '/welcome', '/auth', '/auth/legacy', '/register'];

export const AuthUrlHandler = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const processing = useRef(false);
  const forwarded = useRef(false);

  // 1) Consume auth params on any route (except /verify + /auth/callback,
  //    which run their own dedicated flow).
  useEffect(() => {
    if (location.pathname.startsWith('/verify') || location.pathname.startsWith('/auth/callback')) return;
    if (processing.current) return;

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const code = search.get('code');
    const tokenHash = search.get('token_hash') || search.get('token');
    const type = search.get('type') || hash.get('type');
    const hasHashTokens = !!hash.get('access_token');
    const authError = search.get('error_description') || hash.get('error_description');

    if (authError) {
      navigate(`/verify?error_description=${encodeURIComponent(authError)}`, { replace: true });
      return;
    }
    if (!code && !tokenHash && !hasHashTokens) return;

    processing.current = true;

    (async () => {
      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (tokenHash) {
          await supabase.auth.verifyOtp({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: ((type as any) || 'magiclink'),
            token_hash: tokenHash,
          });
        }
        // hash tokens are consumed automatically by supabase-js

        // Clean the URL so a refresh doesn't retry a used token.
        window.history.replaceState({}, '', location.pathname);

        const { data } = await supabase.auth.getUser();
        if (data.user) {
          forwarded.current = true;
          const route = await resolvePostAuthRoute(data.user);
          navigate(route, { replace: true });
          return;
        }
        navigate('/verify', { replace: true });
      } catch {
        navigate('/verify', { replace: true });
      } finally {
        processing.current = false;
      }
    })();
  }, [location.pathname, location.search, navigate]);

  // 2) Signed-in users should never sit on a public auth screen.
  useEffect(() => {
    if (loading || !user || processing.current || forwarded.current) return;
    if (!PUBLIC_AUTH_PATHS.includes(location.pathname)) return;
    if (window.location.search || window.location.hash) return;

    forwarded.current = true;
    resolvePostAuthRoute(user)
      .then((route) => navigate(route, { replace: true }))
      .catch(() => navigate('/role', { replace: true }));
  }, [user, loading, location.pathname, navigate]);

  return null;
};
