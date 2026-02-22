export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          last_message_at: string | null
          name: string | null
          type: string
          updated_at: string
          user_group_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          type: string
          updated_at?: string
          user_group_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
          updated_at?: string
          user_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_group"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participant: {
        Row: {
          can_add_participants: boolean | null
          can_send_messages: boolean | null
          conversation_id: string
          id: string
          joined_at: string
          last_read_message_id: string | null
          last_seen_at: string | null
          muted_until: string | null
          notifications_enabled: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          can_add_participants?: boolean | null
          can_send_messages?: boolean | null
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_message_id?: string | null
          last_seen_at?: string | null
          muted_until?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          can_add_participants?: boolean | null
          can_send_messages?: boolean | null
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_message_id?: string | null
          last_seen_at?: string | null
          muted_until?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "group_conversations_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event: {
        Row: {
          created_at: string
          created_by: string
          description: string
          event_group_id: string
          from: string
          id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          to: string | null
          type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          event_group_id: string
          from: string
          id?: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          to?: string | null
          type: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          event_group_id?: string
          from?: string
          id?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          to?: string | null
          type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "event_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "event_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_event_group_id_fkey"
            columns: ["event_group_id"]
            isOneToOne: false
            referencedRelation: "event_group"
            referencedColumns: ["id"]
          },
        ]
      }
      event_access: {
        Row: {
          created_at: string
          event_id: string
          id: string
          role: number
          user_group_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          role: number
          user_group_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          role?: number
          user_group_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_access_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "event_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event_group: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_group_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "event_group_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      event_group_access: {
        Row: {
          created_at: string
          event_group_id: string
          id: string
          role: number
          user_group_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_group_id: string
          id?: string
          role: number
          user_group_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_group_id?: string
          id?: string
          role?: number
          user_group_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_group_access_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_group_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "event_group_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_group_map_event_group_id_fkey"
            columns: ["event_group_id"]
            isOneToOne: false
            referencedRelation: "event_group"
            referencedColumns: ["id"]
          },
        ]
      }
      event_user_state: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          event_id: string
          event_sent_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          event_id: string
          event_sent_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          event_id?: string
          event_sent_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_user_state_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_user_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "event_user_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting: {
        Row: {
          created_at: string
          creator_id: string
          ended_at: string | null
          id: string
          started_at: string
          updated_at: string
          video_sdk_meeting_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          video_sdk_meeting_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
          video_sdk_meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "meetings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_event: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "meeting_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participant: {
        Row: {
          camera_enabled_at_join: boolean
          created_at: string
          id: string
          is_moderator: boolean
          joined_at: string
          left_at: string | null
          meeting_id: string
          mic_enabled_at_join: boolean
          user_id: string
        }
        Insert: {
          camera_enabled_at_join?: boolean
          created_at?: string
          id?: string
          is_moderator?: boolean
          joined_at?: string
          left_at?: string | null
          meeting_id: string
          mic_enabled_at_join?: boolean
          user_id: string
        }
        Update: {
          camera_enabled_at_join?: boolean
          created_at?: string
          id?: string
          is_moderator?: boolean
          joined_at?: string
          left_at?: string | null
          meeting_id?: string
          mic_enabled_at_join?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "meeting_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          meeting_id: string | null
          reply_to_id: string | null
          sender_id: string
          sent_during_meeting: boolean | null
        }
        Insert: {
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          meeting_id?: string | null
          reply_to_id?: string | null
          sender_id: string
          sent_during_meeting?: boolean | null
        }
        Update: {
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          meeting_id?: string | null
          reply_to_id?: string | null
          sender_id?: string
          sent_during_meeting?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "group_conversations_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "message"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      notification: {
        Row: {
          archived: string | null
          created_at: string
          id: string
          payload: Json | null
          priority: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          archived?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          priority?: number
          title: string
          type: string
          user_id: string
        }
        Update: {
          archived?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          priority?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      passkey: {
        Row: {
          aaguid: string | null
          backedUp: boolean
          counter: number
          createdAt: string | null
          credentialID: string
          deviceType: string
          id: string
          name: string | null
          publicKey: string
          transports: string | null
          userId: string
        }
        Insert: {
          aaguid?: string | null
          backedUp: boolean
          counter: number
          createdAt?: string | null
          credentialID: string
          deviceType: string
          id: string
          name?: string | null
          publicKey: string
          transports?: string | null
          userId: string
        }
        Update: {
          aaguid?: string | null
          backedUp?: boolean
          counter?: number
          createdAt?: string | null
          credentialID?: string
          deviceType?: string
          id?: string
          name?: string | null
          publicKey?: string
          transports?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "passkey_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "passkey_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      twoFactor: {
        Row: {
          backupCodes: string
          id: string
          secret: string
          userId: string
        }
        Insert: {
          backupCodes: string
          id: string
          secret: string
          userId: string
        }
        Update: {
          backupCodes?: string
          id?: string
          secret?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "twoFactor_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "twoFactor_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string
          email: string
          emailVerified: boolean
          id: string
          image: string | null
          name: string
          twoFactorEnabled: boolean | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          emailVerified: boolean
          id: string
          image?: string | null
          name: string
          twoFactorEnabled?: boolean | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          emailVerified?: boolean
          id?: string
          image?: string | null
          name?: string
          twoFactorEnabled?: boolean | null
          updatedAt?: string
        }
        Relationships: []
      }
      user_group: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "user_group_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_group_member: {
        Row: {
          created_at: string
          id: string
          user_group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_member_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_member_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "user_group_member_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      verification: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      direct_messages_inbox: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_user_id: string | null
          description: string | null
          event_id: string | null
          id: string | null
          last_message_at: string | null
          name: string | null
          partner_email: string | null
          partner_id: string | null
          partner_image: string | null
          partner_name: string | null
          type: string | null
          updated_at: string | null
          user_group_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["current_user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["current_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_group"
            referencedColumns: ["id"]
          },
        ]
      }
      group_conversations_inbox: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_user_id: string | null
          description: string | null
          event_id: string | null
          id: string | null
          last_message_at: string | null
          name: string | null
          participants: Json | null
          type: string | null
          updated_at: string | null
          user_group_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["current_user_id"]
            isOneToOne: false
            referencedRelation: "direct_messages_inbox"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["current_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_group_id_fkey"
            columns: ["user_group_id"]
            isOneToOne: false
            referencedRelation: "user_group"
            referencedColumns: ["id"]
          },
        ]
      }
      view_all_event_access: {
        Row: {
          event_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_conversation_access: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      get_active_events: {
        Args: { requesting_user_id: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          event_group_id: string
          event_user_email: string
          event_user_name: string
          from: string
          id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          to: string
          type: Database["public"]["Enums"]["event_type"]
        }[]
      }
      get_event: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          event_group_id: string
          event_user_email: string
          event_user_name: string
          from: string
          id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          to: string
          type: Database["public"]["Enums"]["event_type"]
        }[]
      }
      get_event_members: {
        Args: { target_event_id: string }
        Returns: {
          acknowledged_at: string
          created_at: string
          event_id: string
          event_sent_at: string
          id: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_user_event_state: {
        Args: { requesting_user_id: string; target_event_id: string }
        Returns: {
          acknowledged_at: string | null
          created_at: string
          event_id: string
          event_sent_at: string | null
          id: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "event_user_state"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_events: {
        Args: { request_id: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          event_group_id: string
          event_user_email: string
          event_user_name: string
          from: string
          id: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          to: string
          type: Database["public"]["Enums"]["event_type"]
        }[]
      }
    }
    Enums: {
      access: "admin" | "read" | "read_write"
      event_status: "cancel" | "archive" | "default"
      event_type: "allday" | "default"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access: ["admin", "read", "read_write"],
      event_status: ["cancel", "archive", "default"],
      event_type: ["allday", "default"],
    },
  },
} as const

