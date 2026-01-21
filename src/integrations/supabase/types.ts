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
      ad_spend_daily: {
        Row: {
          account_id: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number
          created_at: string
          id: string
          impressions: number
          leads_reported: number
          platform: Database["public"]["Enums"]["platform_type"]
          spend: number
          spend_date: string
        }
        Insert: {
          account_id?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number
          created_at?: string
          id?: string
          impressions?: number
          leads_reported?: number
          platform: Database["public"]["Enums"]["platform_type"]
          spend?: number
          spend_date: string
        }
        Update: {
          account_id?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number
          created_at?: string
          id?: string
          impressions?: number
          leads_reported?: number
          platform?: Database["public"]["Enums"]["platform_type"]
          spend?: number
          spend_date?: string
        }
        Relationships: []
      }
      call_agents: {
        Row: {
          agent_id: string
          created_at: string
          enabled: boolean
          first_message_template: string
          id: string
          source_tool: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          enabled?: boolean
          first_message_template: string
          id?: string
          source_tool: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          enabled?: boolean
          first_message_template?: string
          id?: string
          source_tool?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      consultations: {
        Row: {
          created_at: string | null
          email: string
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          phone: string
          preferred_time: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          phone: string
          preferred_time: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          phone?: string
          preferred_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          close_date: string | null
          cogs: number
          commissions: number
          created_at: string
          gross_revenue: number
          id: string
          invoice_id: string | null
          labor_cost: number
          net_profit: number | null
          opportunity_id: string | null
          other_cost: number
          outcome: Database["public"]["Enums"]["deal_outcome"]
          payment_status: Database["public"]["Enums"]["deal_payment_status"]
          updated_at: string
          wm_lead_id: string
        }
        Insert: {
          close_date?: string | null
          cogs?: number
          commissions?: number
          created_at?: string
          gross_revenue?: number
          id?: string
          invoice_id?: string | null
          labor_cost?: number
          net_profit?: number | null
          opportunity_id?: string | null
          other_cost?: number
          outcome?: Database["public"]["Enums"]["deal_outcome"]
          payment_status?: Database["public"]["Enums"]["deal_payment_status"]
          updated_at?: string
          wm_lead_id: string
        }
        Update: {
          close_date?: string | null
          cogs?: number
          commissions?: number
          created_at?: string
          gross_revenue?: number
          id?: string
          invoice_id?: string | null
          labor_cost?: number
          net_profit?: number | null
          opportunity_id?: string | null
          other_cost?: number
          outcome?: Database["public"]["Enums"]["deal_outcome"]
          payment_status?: Database["public"]["Enums"]["deal_payment_status"]
          updated_at?: string
          wm_lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_wm_lead_id_fkey"
            columns: ["wm_lead_id"]
            isOneToOne: false
            referencedRelation: "wm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      global_search_index: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          keywords: string | null
          lead_id: string | null
          payload: Json | null
          search_tsv: unknown
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          keywords?: string | null
          lead_id?: string | null
          payload?: Json | null
          search_tsv?: unknown
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          keywords?: string | null
          lead_id?: string | null
          payload?: Json | null
          search_tsv?: unknown
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      job_heartbeats: {
        Row: {
          job_name: string
          last_run_at: string
          last_summary: Json | null
        }
        Insert: {
          job_name: string
          last_run_at?: string
          last_summary?: Json | null
        }
        Update: {
          job_name?: string
          last_run_at?: string
          last_summary?: Json | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          client_id: string
          created_at: string
          event_id: string
          event_name: string
          id: string
          lead_id: string | null
          page_path: string | null
          payload: Json
          score_delta: number
          section_id: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          event_id: string
          event_name: string
          id?: string
          lead_id?: string | null
          page_path?: string | null
          payload?: Json
          score_delta?: number
          section_id?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          event_id?: string
          event_name?: string
          id?: string
          lead_id?: string | null
          page_path?: string | null
          payload?: Json
          score_delta?: number
          section_id?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          admin_email: string | null
          content: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "wm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          chat_history: Json | null
          client_id: string | null
          created_at: string | null
          email: string
          emotional_state: string | null
          fbc: string | null
          fbp: string | null
          first_touch: Json | null
          gclid: string | null
          id: string
          insurance_carrier: string | null
          last_activity_at: string | null
          last_evidence: Json | null
          last_non_direct_channel: string | null
          last_non_direct_fbclid: string | null
          last_non_direct_gclid: string | null
          last_non_direct_landing_page: string | null
          last_non_direct_utm_medium: string | null
          last_non_direct_utm_source: string | null
          last_touch: Json | null
          lead_score_last_7d: number | null
          lead_score_total: number | null
          lead_status: string | null
          msclkid: string | null
          name: string | null
          phone: string | null
          session_data: Json | null
          source_form: string | null
          source_page: string | null
          source_tool: string
          specific_detail: string | null
          updated_at: string | null
          urgency_level: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          window_count: number | null
        }
        Insert: {
          chat_history?: Json | null
          client_id?: string | null
          created_at?: string | null
          email: string
          emotional_state?: string | null
          fbc?: string | null
          fbp?: string | null
          first_touch?: Json | null
          gclid?: string | null
          id?: string
          insurance_carrier?: string | null
          last_activity_at?: string | null
          last_evidence?: Json | null
          last_non_direct_channel?: string | null
          last_non_direct_fbclid?: string | null
          last_non_direct_gclid?: string | null
          last_non_direct_landing_page?: string | null
          last_non_direct_utm_medium?: string | null
          last_non_direct_utm_source?: string | null
          last_touch?: Json | null
          lead_score_last_7d?: number | null
          lead_score_total?: number | null
          lead_status?: string | null
          msclkid?: string | null
          name?: string | null
          phone?: string | null
          session_data?: Json | null
          source_form?: string | null
          source_page?: string | null
          source_tool?: string
          specific_detail?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          window_count?: number | null
        }
        Update: {
          chat_history?: Json | null
          client_id?: string | null
          created_at?: string | null
          email?: string
          emotional_state?: string | null
          fbc?: string | null
          fbp?: string | null
          first_touch?: Json | null
          gclid?: string | null
          id?: string
          insurance_carrier?: string | null
          last_activity_at?: string | null
          last_evidence?: Json | null
          last_non_direct_channel?: string | null
          last_non_direct_fbclid?: string | null
          last_non_direct_gclid?: string | null
          last_non_direct_landing_page?: string | null
          last_non_direct_utm_medium?: string | null
          last_non_direct_utm_source?: string | null
          last_touch?: Json | null
          lead_score_last_7d?: number | null
          lead_score_total?: number | null
          lead_status?: string | null
          msclkid?: string | null
          name?: string | null
          phone?: string | null
          session_data?: Json | null
          source_form?: string | null
          source_page?: string | null
          source_tool?: string
          specific_detail?: string | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          window_count?: number | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          created_at: string
          expected_value: number
          id: string
          notes: string | null
          probability: number
          stage: Database["public"]["Enums"]["opportunity_stage"]
          updated_at: string
          wm_lead_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          expected_value?: number
          id?: string
          notes?: string | null
          probability?: number
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
          wm_lead_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          expected_value?: number
          id?: string
          notes?: string | null
          probability?: number
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          updated_at?: string
          wm_lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_wm_lead_id_fkey"
            columns: ["wm_lead_id"]
            isOneToOne: false
            referencedRelation: "wm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_calls: {
        Row: {
          agent_id: string
          attempt_count: number
          call_request_id: string
          completed_at: string | null
          created_at: string
          created_date: string | null
          first_message: string
          id: string
          last_error: string | null
          lead_id: string | null
          next_attempt_at: string
          payload: Json
          phone_e164: string
          phone_hash: string
          provider_call_id: string | null
          reason: string | null
          requested_by_user_id: string | null
          scheduled_for: string
          source_tool: string
          status: Database["public"]["Enums"]["pending_call_status"]
          triggered_at: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          attempt_count?: number
          call_request_id?: string
          completed_at?: string | null
          created_at?: string
          created_date?: string | null
          first_message: string
          id?: string
          last_error?: string | null
          lead_id?: string | null
          next_attempt_at?: string
          payload?: Json
          phone_e164: string
          phone_hash: string
          provider_call_id?: string | null
          reason?: string | null
          requested_by_user_id?: string | null
          scheduled_for: string
          source_tool: string
          status?: Database["public"]["Enums"]["pending_call_status"]
          triggered_at?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          attempt_count?: number
          call_request_id?: string
          completed_at?: string | null
          created_at?: string
          created_date?: string | null
          first_message?: string
          id?: string
          last_error?: string | null
          lead_id?: string | null
          next_attempt_at?: string
          payload?: Json
          phone_e164?: string
          phone_hash?: string
          provider_call_id?: string | null
          reason?: string | null
          requested_by_user_id?: string | null
          scheduled_for?: string
          source_tool?: string
          status?: Database["public"]["Enums"]["pending_call_status"]
          triggered_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      phone_call_logs: {
        Row: {
          agent_id: string
          ai_notes: string | null
          call_duration_sec: number | null
          call_request_id: string
          call_sentiment:
            | Database["public"]["Enums"]["phone_call_sentiment"]
            | null
          call_status: Database["public"]["Enums"]["phone_call_status"]
          created_at: string
          ended_at: string | null
          id: string
          lead_id: string | null
          outcome_timeline_written: boolean | null
          provider_call_id: string | null
          raw_outcome_payload: Json | null
          recording_url: string | null
          source_tool: string
          triggered_at: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          ai_notes?: string | null
          call_duration_sec?: number | null
          call_request_id: string
          call_sentiment?:
            | Database["public"]["Enums"]["phone_call_sentiment"]
            | null
          call_status?: Database["public"]["Enums"]["phone_call_status"]
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id?: string | null
          outcome_timeline_written?: boolean | null
          provider_call_id?: string | null
          raw_outcome_payload?: Json | null
          recording_url?: string | null
          source_tool: string
          triggered_at?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          ai_notes?: string | null
          call_duration_sec?: number | null
          call_request_id?: string
          call_sentiment?:
            | Database["public"]["Enums"]["phone_call_sentiment"]
            | null
          call_status?: Database["public"]["Enums"]["phone_call_status"]
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id?: string | null
          outcome_timeline_written?: boolean | null
          provider_call_id?: string | null
          raw_outcome_payload?: Json | null
          recording_url?: string | null
          source_tool?: string
          triggered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_call_logs_call_request_id_fkey"
            columns: ["call_request_id"]
            isOneToOne: false
            referencedRelation: "pending_calls"
            referencedColumns: ["call_request_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          has_password: boolean
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          has_password?: boolean
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          has_password?: boolean
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quote_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          lead_id: string | null
          mime_type: string
          session_id: string
          source_page: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          lead_id?: string | null
          mime_type: string
          session_id: string
          source_page?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          lead_id?: string | null
          mime_type?: string
          session_id?: string
          source_page?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_files_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_receipts: {
        Row: {
          call_request_id: string | null
          correlation_status: Database["public"]["Enums"]["webhook_correlation_status"]
          correlation_step: string | null
          error_code: string | null
          error_message: string | null
          headers: Json
          id: string
          idempotency_key: string | null
          matched_phone_call_log_id: string | null
          parsed_payload: Json | null
          provider: string
          provider_call_id: string | null
          raw_body: string | null
          raw_body_sha256: string
          received_at: string
          retention_until: string
          signature_error: string | null
          signature_mode: string | null
          signature_valid: boolean | null
        }
        Insert: {
          call_request_id?: string | null
          correlation_status?: Database["public"]["Enums"]["webhook_correlation_status"]
          correlation_step?: string | null
          error_code?: string | null
          error_message?: string | null
          headers: Json
          id?: string
          idempotency_key?: string | null
          matched_phone_call_log_id?: string | null
          parsed_payload?: Json | null
          provider?: string
          provider_call_id?: string | null
          raw_body?: string | null
          raw_body_sha256: string
          received_at?: string
          retention_until?: string
          signature_error?: string | null
          signature_mode?: string | null
          signature_valid?: boolean | null
        }
        Update: {
          call_request_id?: string | null
          correlation_status?: Database["public"]["Enums"]["webhook_correlation_status"]
          correlation_step?: string | null
          error_code?: string | null
          error_message?: string | null
          headers?: Json
          id?: string
          idempotency_key?: string | null
          matched_phone_call_log_id?: string | null
          parsed_payload?: Json | null
          provider?: string
          provider_call_id?: string | null
          raw_body?: string | null
          raw_body_sha256?: string
          received_at?: string
          retention_until?: string
          signature_error?: string | null
          signature_mode?: string | null
          signature_valid?: boolean | null
        }
        Relationships: []
      }
      wm_events: {
        Row: {
          created_at: string
          event_category: string | null
          event_data: Json | null
          event_name: string
          id: string
          page_path: string | null
          page_title: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_category?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          page_path?: string | null
          page_title?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_category?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          page_path?: string | null
          page_title?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wm_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "wm_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wm_leads: {
        Row: {
          actual_deal_value: number | null
          assigned_to: string | null
          captured_at: string | null
          city: string | null
          closed_at: string | null
          created_at: string
          disqualification_reason: string | null
          disqualified_at: string | null
          email: string
          engagement_score: number | null
          estimated_deal_value: number | null
          facebook_ad_id: string | null
          facebook_page_name: string | null
          fbclid: string | null
          first_name: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          last_contacted_at: string | null
          last_name: string | null
          last_non_direct_channel: string | null
          last_non_direct_fbclid: string | null
          last_non_direct_gclid: string | null
          last_non_direct_landing_page: string | null
          last_non_direct_utm_medium: string | null
          last_non_direct_utm_source: string | null
          lead_id: string | null
          lead_quality: string | null
          notes: string | null
          original_session_id: string | null
          original_source_tool: string | null
          phone: string | null
          qualified_at: string | null
          qualified_cv_fired: boolean | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          verified_social_url: string | null
        }
        Insert: {
          actual_deal_value?: number | null
          assigned_to?: string | null
          captured_at?: string | null
          city?: string | null
          closed_at?: string | null
          created_at?: string
          disqualification_reason?: string | null
          disqualified_at?: string | null
          email: string
          engagement_score?: number | null
          estimated_deal_value?: number | null
          facebook_ad_id?: string | null
          facebook_page_name?: string | null
          fbclid?: string | null
          first_name?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_non_direct_channel?: string | null
          last_non_direct_fbclid?: string | null
          last_non_direct_gclid?: string | null
          last_non_direct_landing_page?: string | null
          last_non_direct_utm_medium?: string | null
          last_non_direct_utm_source?: string | null
          lead_id?: string | null
          lead_quality?: string | null
          notes?: string | null
          original_session_id?: string | null
          original_source_tool?: string | null
          phone?: string | null
          qualified_at?: string | null
          qualified_cv_fired?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          verified_social_url?: string | null
        }
        Update: {
          actual_deal_value?: number | null
          assigned_to?: string | null
          captured_at?: string | null
          city?: string | null
          closed_at?: string | null
          created_at?: string
          disqualification_reason?: string | null
          disqualified_at?: string | null
          email?: string
          engagement_score?: number | null
          estimated_deal_value?: number | null
          facebook_ad_id?: string | null
          facebook_page_name?: string | null
          fbclid?: string | null
          first_name?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_non_direct_channel?: string | null
          last_non_direct_fbclid?: string | null
          last_non_direct_gclid?: string | null
          last_non_direct_landing_page?: string | null
          last_non_direct_utm_medium?: string | null
          last_non_direct_utm_source?: string | null
          lead_id?: string | null
          lead_quality?: string | null
          notes?: string | null
          original_session_id?: string | null
          original_source_tool?: string | null
          phone?: string | null
          qualified_at?: string | null
          qualified_cv_fired?: boolean | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          verified_social_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wm_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wm_leads_original_session_id_fkey"
            columns: ["original_session_id"]
            isOneToOne: false
            referencedRelation: "wm_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wm_sessions: {
        Row: {
          anonymous_id: string
          created_at: string
          id: string
          ip_hash: string | null
          landing_page: string | null
          lead_id: string | null
          referrer: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          anonymous_id: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          lead_id?: string | null
          referrer?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          anonymous_id?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          landing_page?: string | null
          lead_id?: string | null
          referrer?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wm_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_all_lead_scores: {
        Args: { p_lookback_days?: number }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_webhook_receipts: { Args: never; Returns: Json }
      delete_search_index: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      extract_digits: { Args: { input: string }; Returns: string }
      get_event_score: {
        Args: { event_category: string; event_name: string }
        Returns: number
      }
      get_lead_quality: { Args: { score: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rpc_claim_pending_calls: {
        Args: { batch_size?: number }
        Returns: {
          agent_id: string
          attempt_count: number
          call_request_id: string
          first_message: string
          id: string
          lead_id: string
          payload: Json
          phone_e164: string
          source_tool: string
        }[]
      }
      rpc_retry_dead_letter: {
        Args: { p_call_request_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_lead_score_from_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      upsert_search_index: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_keywords: string
          p_lead_id: string
          p_payload?: Json
          p_subtitle: string
          p_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      deal_outcome: "won" | "lost"
      deal_payment_status:
        | "unpaid"
        | "deposit_paid"
        | "paid_in_full"
        | "refunded"
      lead_status:
        | "new"
        | "qualifying"
        | "mql"
        | "qualified"
        | "appointment_set"
        | "sat"
        | "closed_won"
        | "closed_lost"
        | "dead"
      opportunity_stage:
        | "new"
        | "qualifying"
        | "quoted"
        | "negotiating"
        | "won"
        | "lost"
      pending_call_status:
        | "pending"
        | "processing"
        | "called"
        | "completed"
        | "no_answer"
        | "failed"
        | "dead_letter"
        | "suppressed"
      phone_call_sentiment: "positive" | "neutral" | "negative"
      phone_call_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "no_answer"
        | "failed"
        | "canceled"
      platform_type: "meta" | "google" | "other"
      webhook_correlation_status:
        | "unprocessed"
        | "matched"
        | "unmatched"
        | "invalid"
        | "duplicate"
        | "processed"
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
      app_role: ["admin", "moderator", "user"],
      deal_outcome: ["won", "lost"],
      deal_payment_status: [
        "unpaid",
        "deposit_paid",
        "paid_in_full",
        "refunded",
      ],
      lead_status: [
        "new",
        "qualifying",
        "mql",
        "qualified",
        "appointment_set",
        "sat",
        "closed_won",
        "closed_lost",
        "dead",
      ],
      opportunity_stage: [
        "new",
        "qualifying",
        "quoted",
        "negotiating",
        "won",
        "lost",
      ],
      pending_call_status: [
        "pending",
        "processing",
        "called",
        "completed",
        "no_answer",
        "failed",
        "dead_letter",
        "suppressed",
      ],
      phone_call_sentiment: ["positive", "neutral", "negative"],
      phone_call_status: [
        "pending",
        "in_progress",
        "completed",
        "no_answer",
        "failed",
        "canceled",
      ],
      platform_type: ["meta", "google", "other"],
      webhook_correlation_status: [
        "unprocessed",
        "matched",
        "unmatched",
        "invalid",
        "duplicate",
        "processed",
      ],
    },
  },
} as const
