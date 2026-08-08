import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
import {
  SOCIAL_CLOUD_LABELS,
  type SocialCloudAction,
  type SocialCloudRefType,
} from '@/lib/socialCloud';

interface AwardInput {
  action: SocialCloudAction;
  refType?: SocialCloudRefType;
  refId?: string | null;
  /** Suppress the toast (e.g. when another success toast already fires). */
  silent?: boolean;
}

/**
 * Awards Social Cloud points for a meaningful action.
 *
 * Idempotency is enforced server-side: `award_social_cloud` returns 0 when the
 * same (profile, reason, ref) reward already exists, so repeated RSVP toggles,
 * duplicate share clicks or re-opened screens can never farm points.
 */
export const useAwardSocialCloud = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, refType, refId }: AwardInput) => {
      const { data, error } = await supabase.rpc('award_social_cloud', {
        _reason: action,
        _ref_type: refType ?? null,
        _ref_id: refId ?? null,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (delta, { action, refId, silent }) => {
      if (!delta) return; // already awarded — stay quiet, no duplicate reward
      track('social_cloud_action_awarded', { eventId: refId ?? undefined, status: action, count: delta });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['badge-system'] });
      if (silent) return;
      toast({
        title: `+${delta} Social Cloud`,
        description: SOCIAL_CLOUD_LABELS[action],
      });
    },
  });
};
