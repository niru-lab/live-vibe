export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          name: string
          timezone: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          name: string
          timezone?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          host_accepted: boolean | null
          host_message: string | null
          host_responded_at: string | null
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          host_accepted?: boolean | null
          host_message?: string | null
          host_responded_at?: string | null
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          host_accepted?: boolean | null
          host_message?: string | null
          host_responded_at?: string | null
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invited_by: string | null
          invited_user_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invited_by?: string | null
          invited_user_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invited_by?: string | null
          invited_user_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          includes_address: boolean | null
          is_read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          includes_address?: boolean | null
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          includes_address?: boolean | null
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          category: Database["public"]["Enums"]["event_category"]
          city: string
          cover_image_url: string | null
          created_at: string
          creator_id: string
          deleted_at: string | null
          description: string | null
          dos_and_donts: string | null
          dresscode: string | null
          ends_at: string | null
          entry_price: number | null
          expected_attendees: number | null
          id: string
          is_active: boolean
          is_free: boolean
          latitude: number | null
          location_name: string
          longitude: number | null
          name: string
          starts_at: string
          updated_at: string
          visibility: Database["public"]["Enums"]["visibility_level"]
        }
        Insert: {
          address: string
          category?: Database["public"]["Enums"]["event_category"]
          city: string
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          description?: string | null
          dos_and_donts?: string | null
          dresscode?: string | null
          ends_at?: string | null
          entry_price?: number | null
          expected_attendees?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          latitude?: number | null
          location_name: string
          longitude?: number | null
          name: string
          starts_at: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Update: {
          address?: string
          category?: Database["public"]["Enums"]["event_category"]
          city?: string
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          description?: string | null
          dos_and_donts?: string | null
          dresscode?: string | null
          ends_at?: string | null
          entry_price?: number | null
          expected_attendees?: number | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          latitude?: number | null
          location_name?: string
          longitude?: number | null
          name?: string
          starts_at?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["visibility_level"]
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hotspot_cells: {
        Row: {
          cell_id: string
          center_lat: number | null
          center_lng: number | null
          city_id: string
          engagement_score: number
          id: string
          post_count: number
          updated_at: string
          window_end: string
          window_start: string
        }
        Insert: {
          cell_id: string
          center_lat?: number | null
          center_lng?: number | null
          city_id: string
          engagement_score?: number
          id?: string
          post_count?: number
          updated_at?: string
          window_end: string
          window_start: string
        }
        Update: {
          cell_id?: string
          center_lat?: number | null
          center_lng?: number | null
          city_id?: string
          engagement_score?: number
          id?: string
          post_count?: number
          updated_at?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotspot_cells_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "event_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          ref_id: string | null
          ref_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          ref_id?: string | null
          ref_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          ref_id?: string | null
          ref_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_events: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          max_attempts: number
          payload: Json
          processed_at: string | null
          status: Database["public"]["Enums"]["outbox_status"]
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          max_attempts?: number
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["outbox_status"]
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          max_attempts?: number
          payload?: Json
          processed_at?: string | null
          status?: Database["public"]["Enums"]["outbox_status"]
        }
        Relationships: []
      }
      point_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          profile_id: string
          reason: string
          ref_id: string | null
          ref_type: string | null
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          profile_id: string
          reason: string
          ref_id?: string | null
          ref_type?: string | null
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          profile_id?: string
          reason?: string
          ref_id?: string | null
          ref_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          height: number | null
          id: string
          media_type: string
          media_url: string
          post_id: string
          sort_order: number
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          media_type?: string
          media_url: string
          post_id: string
          sort_order?: number
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          sort_order?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          city: string | null
          city_id: string | null
          comments_count: number
          created_at: string
          deleted_at: string | null
          event_id: string | null
          expires_at: string | null
          id: string
          is_moment_x: boolean
          latitude: number | null
          likes_count: number
          location_id: string | null
          location_name: string | null
          longitude: number | null
          media_type: string
          media_url: string
          music_artist: string | null
          music_title: string | null
          music_url: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          venue_id: string | null
        }
        Insert: {
          author_id: string
          caption?: string | null
          city?: string | null
          city_id?: string | null
          comments_count?: number
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_moment_x?: boolean
          latitude?: number | null
          likes_count?: number
          location_id?: string | null
          location_name?: string | null
          longitude?: number | null
          media_type?: string
          media_url: string
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          venue_id?: string | null
        }
        Update: {
          author_id?: string
          caption?: string | null
          city?: string | null
          city_id?: string | null
          comments_count?: number
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_moment_x?: boolean
          latitude?: number | null
          likes_count?: number
          location_id?: string | null
          location_name?: string | null
          longitude?: number | null
          media_type?: string
          media_url?: string
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          created_at: string
          discover_visible: boolean
          dm_policy: Database["public"]["Enums"]["dm_policy"]
          hide_event_attendance: boolean
          id: string
          location_enabled: boolean
          online_status_visible: boolean
          profile_id: string
          profile_visibility: Database["public"]["Enums"]["visibility_level"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          discover_visible?: boolean
          dm_policy?: Database["public"]["Enums"]["dm_policy"]
          hide_event_attendance?: boolean
          id?: string
          location_enabled?: boolean
          online_status_visible?: boolean
          profile_id: string
          profile_visibility?: Database["public"]["Enums"]["visibility_level"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          discover_visible?: boolean
          dm_policy?: Database["public"]["Enums"]["dm_policy"]
          hide_event_attendance?: boolean
          id?: string
          location_enabled?: boolean
          online_status_visible?: boolean
          profile_id?: string
          profile_visibility?: Database["public"]["Enums"]["visibility_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string
          id: string
          is_verified: boolean
          profile_type: Database["public"]["Enums"]["profile_type"]
          show_badge_in_bio: boolean
          show_sc_in_bio: boolean
          social_cloud_points: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_verified?: boolean
          profile_type?: Database["public"]["Enums"]["profile_type"]
          show_badge_in_bio?: boolean
          show_sc_in_bio?: boolean
          social_cloud_points?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_verified?: boolean
          profile_type?: Database["public"]["Enums"]["profile_type"]
          show_badge_in_bio?: boolean
          show_sc_in_bio?: boolean
          social_cloud_points?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_recurring_events: {
        Row: {
          address: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          id: string
          is_active: boolean
          location_name: string | null
          recurrence: string
          room_id: string
          time_of_day: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          id?: string
          is_active?: boolean
          location_name?: string | null
          recurrence?: string
          room_id: string
          time_of_day?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          id?: string
          is_active?: boolean
          location_name?: string | null
          recurrence?: string
          room_id?: string
          time_of_day?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_recurring_events_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          activity: string | null
          address: string | null
          category: string
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          hoster_id: string
          id: string
          is_active: boolean
          latitude: number | null
          location_name: string | null
          longitude: number | null
          name: string
          updated_at: string
          visibility: string
        }
        Insert: {
          activity?: string | null
          address?: string | null
          category?: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          hoster_id: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          name: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          activity?: string | null
          address?: string | null
          category?: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          hoster_id?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          name?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hoster_id_fkey"
            columns: ["hoster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_items: {
        Row: {
          created_at: string
          id: string
          post_id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          id: string
          level: number
          points: number
          profile_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          level?: number
          points?: number
          profile_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          level?: number
          points?: number
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          category: string
          city: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_verified: boolean
          latitude: number
          longitude: number
          name: string
          owner_profile_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          category: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          latitude: number
          longitude: number
          name: string
          owner_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean
          latitude?: number
          longitude?: number
          name?: string
          owner_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_points: {
        Args: {
          p_delta: number
          p_profile_id: string
          p_reason: string
          p_ref_id?: string
          p_ref_type?: string
        }
        Returns: undefined
      }
      calculate_level: { Args: { pts: number }; Returns: number }
      can_send_dm: {
        Args: { recipient_id: string; sender_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { target_id: string; viewer_id: string }
        Returns: boolean
      }
      delete_expired_posts: { Args: never; Returns: undefined }
      get_user_room_ids: { Args: { _profile_id: string }; Returns: string[] }
      is_blocked: {
        Args: { checker_id: string; target_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { _room_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dm_policy: "everyone" | "followers" | "nobody"
      event_category:
        | "club"
        | "house_party"
        | "bar"
        | "festival"
        | "concert"
        | "other"
        | "sport"
      invite_status: "invited" | "interested" | "accepted" | "declined"
      notification_type:
        | "like"
        | "comment"
        | "follow"
        | "event_invite"
        | "event_message"
        | "mention"
        | "level_up"
        | "moment_x_trending"
      outbox_status: "pending" | "processing" | "done" | "failed"
      post_type: "normal" | "moment_x"
      profile_type: "user" | "club" | "organizer"
      visibility_level: "public" | "followers" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dm_policy: ["everyone", "followers", "nobody"],
      event_category: [
        "club",
        "house_party",
        "bar",
        "festival",
        "concert",
        "other",
        "sport",
      ],
      invite_status: ["invited", "interested", "accepted", "declined"],
      notification_type: [
        "like",
        "comment",
        "follow",
        "event_invite",
        "event_message",
        "mention",
        "level_up",
        "moment_x_trending",
      ],
      outbox_status: ["pending", "processing", "done", "failed"],
      post_type: ["normal", "moment_x"],
      profile_type: ["user", "club", "organizer"],
      visibility_level: ["public", "followers", "private"],
    },
  },
} as const
