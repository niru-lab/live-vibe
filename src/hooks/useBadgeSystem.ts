import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

// 9 Badge levels
export interface BadgeLevel {
  level: number;
  name: string;
  emoji: string;
  minPoints: number;
  color: string;
}

export const BADGE_LEVELS: BadgeLevel[] = [
  { level: 0, name: 'NEULING', emoji: '🆕', minPoints: 0, color: 'text-muted-foreground' },
  { level: 1, name: 'PARTY STARTER', emoji: '🎉', minPoints: 100, color: 'text-green-500' },
  { level: 2, name: 'NACHTFALKE', emoji: '🌃', minPoints: 500, color: 'text-blue-400' },
  { level: 3, name: 'PARTY FUCHS', emoji: '🦊', minPoints: 1500, color: 'text-orange-500' },
  { level: 4, name: 'PARTY HASE', emoji: '🐰', minPoints: 5000, color: 'text-pink-400' },
  { level: 5, name: 'PARTY LÖWE', emoji: '🦁', minPoints: 15000, color: 'text-yellow-500' },
  { level: 6, name: 'NACHTKÖNIG', emoji: '👑', minPoints: 50000, color: 'text-purple-500' },
  { level: 7, name: 'PARTY LEGENDE', emoji: '⚔️', minPoints: 150000, color: 'text-red-500' },
  { level: 8, name: 'PARTY CHAMPION', emoji: '🏆', minPoints: 500000, color: 'text-amber-400' },
  { level: 9, name: 'PARTY GOTT', emoji: '🌟', minPoints: 1000000, color: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500' },
];

// 50 Faktoren grouped into 5 categories
export const FACTOR_CATEGORIES = {
  content: {
    name: 'CONTENT',
    emoji: '📸',
    factors: [
      { id: 'posts_total', name: 'Gesamt Posts', weight: 10 },
      { id: 'posts_weekly', name: 'Posts diese Woche', weight: 15 },
      { id: 'moment_x_posts', name: 'Moment-X Posts', weight: 20 },
      { id: 'video_posts', name: 'Video Posts', weight: 12 },
      { id: 'music_posts', name: 'Posts mit Musik', weight: 8 },
      { id: 'location_posts', name: 'Posts mit Location', weight: 8 },
      { id: 'avg_likes', name: 'Durchschnitt Likes', weight: 15 },
      { id: 'avg_comments', name: 'Durchschnitt Kommentare', weight: 12 },
      { id: 'viral_posts', name: 'Virale Posts (50+ Likes)', weight: 25 },
      { id: 'trending_posts', name: 'Trending Posts', weight: 20 },
      { id: 'caption_quality', name: 'Caption Qualität', weight: 5 },
      { id: 'consistent_posting', name: 'Konsistenz beim Posten', weight: 10 },
    ],
  },
  events: {
    name: 'EVENTS',
    emoji: '🎉',
    factors: [
      { id: 'events_created', name: 'Events erstellt', weight: 20 },
      { id: 'events_attended', name: 'Events besucht', weight: 15 },
      { id: 'event_rsvps_received', name: 'Erhaltene Zusagen', weight: 18 },
      { id: 'event_posts', name: 'Event-Posts', weight: 10 },
      { id: 'event_organizer', name: 'Event Organizer Score', weight: 25 },
      { id: 'popular_events', name: 'Populäre Events (100+)', weight: 30 },
      { id: 'recurring_events', name: 'Wiederholende Events', weight: 15 },
      { id: 'event_diversity', name: 'Event Vielfalt', weight: 8 },
      { id: 'early_rsvp', name: 'Frühe Zusagen', weight: 5 },
      { id: 'event_check_ins', name: 'Event Check-Ins', weight: 12 },
    ],
  },
  social: {
    name: 'SOCIAL',
    emoji: '👥',
    factors: [
      { id: 'followers', name: 'Follower', weight: 15 },
      { id: 'following_ratio', name: 'Follow-Ratio', weight: 8 },
      { id: 'engagement_rate', name: 'Engagement Rate', weight: 20 },
      { id: 'comments_given', name: 'Gegebene Kommentare', weight: 10 },
      { id: 'likes_given', name: 'Gegebene Likes', weight: 8 },
      { id: 'shares', name: 'Shares erhalten', weight: 15 },
      { id: 'mentions', name: 'Erwähnungen', weight: 12 },
      { id: 'profile_views', name: 'Profil-Aufrufe', weight: 10 },
      { id: 'connections_quality', name: 'Qualität der Connections', weight: 18 },
      { id: 'referrals', name: 'Geworbene Nutzer', weight: 25 },
    ],
  },
  engagement: {
    name: 'ENGAGEMENT',
    emoji: '⏰',
    factors: [
      { id: 'app_days', name: 'App-Tage', weight: 12 },
      { id: 'login_streak', name: 'Login Streak', weight: 20 },
      { id: 'weekend_activity', name: 'Wochenend-Aktivität', weight: 15 },
      { id: 'night_owl', name: 'Nachteule (22-6 Uhr)', weight: 10 },
      { id: 'daily_active', name: 'Täglich aktiv', weight: 18 },
      { id: 'weekly_active', name: 'Wöchentlich aktiv', weight: 12 },
      { id: 'session_duration', name: 'Session-Dauer', weight: 8 },
      { id: 'feature_usage', name: 'Feature-Nutzung', weight: 10 },
      { id: 'perfect_weeks', name: 'Perfekte Wochen', weight: 25 },
      { id: 'comeback_bonus', name: 'Comeback Bonus', weight: 5 },
    ],
  },
  performance: {
    name: 'PERFORMANCE',
    emoji: '🏆',
    factors: [
      { id: 'city_ranking', name: 'Stadt-Ranking', weight: 30 },
      { id: 'weekly_growth', name: 'Wöchentliches Wachstum', weight: 20 },
      { id: 'monthly_growth', name: 'Monatliches Wachstum', weight: 15 },
      { id: 'consistency_score', name: 'Konsistenz-Score', weight: 18 },
      { id: 'quality_score', name: 'Qualitäts-Score', weight: 22 },
      { id: 'influence_score', name: 'Einfluss-Score', weight: 25 },
      { id: 'loyalty_bonus', name: 'Loyalitäts-Bonus', weight: 20 },
      { id: 'special_achievements', name: 'Spezial-Achievements', weight: 35 },
    ],
  },
} as const;

// Active Streaks
export const STREAKS = [
  { id: '7_day_login', name: '7-Tage Login', emoji: '🔥', description: '7 Tage in Folge eingeloggt' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', emoji: '🎊', description: 'Jedes Wochenende aktiv' },
  { id: 'music_master', name: 'Music Master', emoji: '🎵', description: '10+ Posts mit Musik' },
  { id: 'event_host', name: 'Event Host', emoji: '🎪', description: '5+ Events erstellt' },
  { id: 'social_butterfly', name: 'Social Butterfly', emoji: '🦋', description: '100+ Follower' },
  { id: 'content_king', name: 'Content King', emoji: '👑', description: '50+ Posts' },
  { id: 'night_owl', name: 'Nachteule', emoji: '🦉', description: '20+ Posts nach Mitternacht' },
  { id: 'early_bird', name: 'Frühaufsteher', emoji: '🐦', description: 'Erster Post des Tages' },
  { id: 'viral_hit', name: 'Viral Hit', emoji: '💥', description: 'Post mit 100+ Likes' },
  { id: 'perfect_week', name: 'Perfect Week', emoji: '✨', description: 'Jeden Tag aktiv' },
] as const;

export interface BadgeData {
  level: number;
  name: string;
  emoji: string;
  color: string;
  totalPoints: number;
  appDays: number;
  cityRank: number | null;
  nextLevel: BadgeLevel | null;
  progressToNext: number;
  pointsToNext: number;
  categoryScores: {
    content: number;
    events: number;
    social: number;
    engagement: number;
    performance: number;
  };
  activeStreaks: string[];
  weeklyGain: number;
}

export const getBadgeForPoints = (points: number) => {
  let badge = BADGE_LEVELS[0];
  for (const level of BADGE_LEVELS) {
    if (points >= level.minPoints) {
      badge = level;
    } else {
      break;
    }
  }
  return badge;
};

export const getNextBadge = (currentLevel: number) => {
  if (currentLevel >= 9) return null;
  return BADGE_LEVELS[currentLevel + 1];
};

export const useBadgeSystem = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['badge-system', profileId],
    queryFn: async (): Promise<BadgeData | null> => {
      if (!profileId) return null;

      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('social_cloud_points, created_at, city')
        .eq('id', profileId)
        .single();

      if (!profile) return null;

      // Calculate app days
      const appDays = differenceInDays(new Date(), new Date(profile.created_at));

      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profileId);

      // Fetch events created count
      const { count: eventsCreated } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', profileId);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileId);

      // Fetch event attendances
      const { count: eventsAttended } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);

      // Calculate category scores (simplified - in production this would be more complex)
      const contentScore = Math.min(((postsCount || 0) / 50) * 100, 100);
      const eventsScore = Math.min((((eventsCreated || 0) + (eventsAttended || 0)) / 30) * 100, 100);
      const socialScore = Math.min(((followersCount || 0) / 500) * 100, 100);
      const engagementScore = Math.min((appDays / 365) * 100, 100);
      const performanceScore = (contentScore + eventsScore + socialScore + engagementScore) / 4;

      const totalPoints = profile.social_cloud_points || 0;
      const currentBadge = getBadgeForPoints(totalPoints);
      const nextBadge = getNextBadge(currentBadge.level);

      // Calculate progress to next level
      let progressToNext = 100;
      let pointsToNext = 0;
      if (nextBadge) {
        const currentMin = currentBadge.minPoints;
        const nextMin = nextBadge.minPoints;
        const pointsInLevel = totalPoints - currentMin;
        const levelRange = nextMin - currentMin;
        progressToNext = Math.min((pointsInLevel / levelRange) * 100, 100);
        pointsToNext = nextMin - totalPoints;
      }

      // Calculate active streaks based on real data
      const activeStreaks: string[] = [];
      if ((postsCount || 0) >= 50) activeStreaks.push('content_king');
      if ((followersCount || 0) >= 100) activeStreaks.push('social_butterfly');
      if ((eventsCreated || 0) >= 5) activeStreaks.push('event_host');
      if (appDays >= 7) activeStreaks.push('7_day_login');

      // City ranking (simplified - would need proper implementation)
      let cityRank: number | null = null;
      if (profile.city) {
        const { data: cityProfiles } = await supabase
          .from('profiles')
          .select('id, social_cloud_points')
          .eq('city', profile.city)
          .order('social_cloud_points', { ascending: false })
          .limit(100);

        if (cityProfiles) {
          const rank = cityProfiles.findIndex(p => p.id === profileId) + 1;
          if (rank > 0) cityRank = rank;
        }
      }

      return {
        level: currentBadge.level,
        name: currentBadge.name,
        emoji: currentBadge.emoji,
        color: currentBadge.color,
        totalPoints,
        appDays,
        cityRank,
        nextLevel: nextBadge,
        progressToNext,
        pointsToNext,
        categoryScores: {
          content: contentScore,
          events: eventsScore,
          social: socialScore,
          engagement: engagementScore,
          performance: performanceScore,
        },
        activeStreaks,
        weeklyGain: Math.floor(Math.random() * 500) + 100, // Placeholder - would need proper tracking
      };
    },
    enabled: !!profileId,
  });
};

// Hook to get badge display for any profile (for feed/comments)
export const useProfileBadge = (profileId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-badge', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('social_cloud_points')
        .eq('id', profileId)
        .single();

      if (!profile) return null;

      return getBadgeForPoints(profile.social_cloud_points || 0);
    },
    enabled: !!profileId,
  });
};
