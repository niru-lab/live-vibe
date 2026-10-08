import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Spinner = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-background">
    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
  </div>
);

/** Requires a session; otherwise sends the user to /auth and returns afterwards. */
export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) {
    const back = location.pathname + location.search;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(back)}`} replace />;
  }
  return <Outlet />;
};

export type AppRole = 'guest' | 'venue_owner' | 'admin';

export const useMyRoles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-roles', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
};

/** Requires one of the given roles (server-side user_roles); otherwise → /. */
export const RoleRoute = ({ roles }: { roles: AppRole[] }) => {
  const { data, isLoading } = useMyRoles();
  if (isLoading) return <Spinner />;
  if (!data?.some((r) => roles.includes(r) || r === 'admin')) return <Navigate to="/" replace />;
  return <Outlet />;
};
