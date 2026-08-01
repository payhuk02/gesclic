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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_features: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          feature_key: string
          id: string
          label: string
          max_tokens: number
          model: string | null
          provider_id: string | null
          system_prompt: string | null
          temperature: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          feature_key: string
          id?: string
          label: string
          max_tokens?: number
          model?: string | null
          provider_id?: string | null
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          feature_key?: string
          id?: string
          label?: string
          max_tokens?: number
          model?: string | null
          provider_id?: string | null
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_features_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_key: string | null
          api_key_last4: string | null
          base_url: string
          created_at: string
          default_model: string | null
          enabled: boolean
          id: string
          label: string
          priority: number
          provider: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_key_last4?: string | null
          base_url: string
          created_at?: string
          default_model?: string | null
          enabled?: boolean
          id?: string
          label: string
          priority?: number
          provider: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_key_last4?: string | null
          base_url?: string
          created_at?: string
          default_model?: string | null
          enabled?: boolean
          id?: string
          label?: string
          priority?: number
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          error: string | null
          feature_key: string | null
          id: string
          latency_ms: number | null
          model: string | null
          provider: string | null
          status: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          feature_key?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          provider?: string | null
          status: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          feature_key?: string | null
          id?: string
          latency_ms?: number | null
          model?: string | null
          provider?: string | null
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          clinic_id: string
          created_at: string
          event_category: string
          event_name: string
          event_properties: Json | null
          id: string
          page_url: string | null
          referrer_url: string | null
          user_agent: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          event_category: string
          event_name: string
          event_properties?: Json | null
          id?: string
          page_url?: string | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          event_category?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          page_url?: string | null
          referrer_url?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      api_documentation: {
        Row: {
          category: string
          content: Json
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit_tier: string | null
          requests_per_day: number | null
          requests_per_minute: number | null
          scopes: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit_tier?: string | null
          requests_per_day?: number | null
          requests_per_minute?: number | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit_tier?: string | null
          requests_per_day?: number | null
          requests_per_minute?: number | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          method: string
          path: string
          query_params: Json | null
          request_body: Json | null
          response_body: Json | null
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
          version: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          method: string
          path: string
          query_params?: Json | null
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
          version?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          method?: string
          path?: string
          query_params?: Json | null
          request_body?: Json | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          doctor_name: string
          id: string
          patient_id: string | null
          patient_name: string
          status: string
          time: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          doctor_name: string
          id?: string
          patient_id?: string | null
          patient_name: string
          status?: string
          time: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          doctor_name?: string
          id?: string
          patient_id?: string | null
          patient_name?: string
          status?: string
          time?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          clinic_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          success: boolean
          user_agent: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          clinic_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          success: boolean
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          clinic_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          location: string | null
          name: string
          retention_days: number
          size_bytes: number
          status: string
          updated_at: string
        }
        Insert: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          location?: string | null
          name: string
          retention_days?: number
          size_bytes?: number
          status?: string
          updated_at?: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          location?: string | null
          name?: string
          retention_days?: number
          size_bytes?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          clinic_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          clinic_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          clinic_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invitations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_decisions: {
        Row: {
          actual_diagnosis: string | null
          ai_confidence_score: number | null
          ai_differential_diagnosis: Json | null
          ai_recommended_tests: Json | null
          ai_risk_factors: Json | null
          ai_treatment_suggestions: Json | null
          clinic_id: string
          created_at: string
          current_medications: Json | null
          follow_up_required: boolean | null
          id: string
          medical_history_summary: string | null
          patient_id: string
          provider_actions: Json | null
          provider_agreement_with_ai: boolean | null
          provider_diagnosis: string | null
          provider_id: string
          symptoms: Json
          treatment_outcome: string | null
          updated_at: string
          vitals: Json | null
        }
        Insert: {
          actual_diagnosis?: string | null
          ai_confidence_score?: number | null
          ai_differential_diagnosis?: Json | null
          ai_recommended_tests?: Json | null
          ai_risk_factors?: Json | null
          ai_treatment_suggestions?: Json | null
          clinic_id: string
          created_at?: string
          current_medications?: Json | null
          follow_up_required?: boolean | null
          id?: string
          medical_history_summary?: string | null
          patient_id: string
          provider_actions?: Json | null
          provider_agreement_with_ai?: boolean | null
          provider_diagnosis?: string | null
          provider_id: string
          symptoms: Json
          treatment_outcome?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Update: {
          actual_diagnosis?: string | null
          ai_confidence_score?: number | null
          ai_differential_diagnosis?: Json | null
          ai_recommended_tests?: Json | null
          ai_risk_factors?: Json | null
          ai_treatment_suggestions?: Json | null
          clinic_id?: string
          created_at?: string
          current_medications?: Json | null
          follow_up_required?: boolean | null
          id?: string
          medical_history_summary?: string | null
          patient_id?: string
          provider_actions?: Json | null
          provider_agreement_with_ai?: boolean | null
          provider_diagnosis?: string | null
          provider_id?: string
          symptoms?: Json
          treatment_outcome?: string | null
          updated_at?: string
          vitals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_decisions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_decisions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_decisions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_decisions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "mv_provider_performance"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "clinical_decisions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_performance"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      clinics: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          plan: string
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          clinic_id: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          specialty: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          specialty?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          specialty?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string
          created_at: string
          html_content: string
          id: string
          is_active: boolean
          key: string
          last_sent_at: string | null
          name: string
          sent_count: number
          subject: string
          template_type: string
          text_content: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          category?: string
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          key: string
          last_sent_at?: string | null
          name: string
          sent_count?: number
          subject: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          category?: string
          created_at?: string
          html_content?: string
          id?: string
          is_active?: boolean
          key?: string
          last_sent_at?: string | null
          name?: string
          sent_count?: number
          subject?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          enabled: boolean
          environment: string
          id: string
          key: string
          name: string
          rollout_percentage: number
          target_clinics: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          environment?: string
          id?: string
          key: string
          name: string
          rollout_percentage?: number
          target_clinics?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          environment?: string
          id?: string
          key?: string
          name?: string
          rollout_percentage?: number
          target_clinics?: Json
          updated_at?: string
        }
        Relationships: []
      }
      integration_catalog: {
        Row: {
          api_documentation_url: string | null
          auth_type: string | null
          average_rating: number | null
          category: string
          created_at: string | null
          description: string | null
          developer_id: string | null
          featured: boolean | null
          id: string
          logo_url: string | null
          name: string
          pricing_details: Json | null
          pricing_model: string | null
          screenshots: Json | null
          sdk_urls: Json | null
          status: string | null
          total_installs: number | null
          total_reviews: number | null
          updated_at: string | null
          version: string | null
          webhook_url: string | null
        }
        Insert: {
          api_documentation_url?: string | null
          auth_type?: string | null
          average_rating?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          featured?: boolean | null
          id?: string
          logo_url?: string | null
          name: string
          pricing_details?: Json | null
          pricing_model?: string | null
          screenshots?: Json | null
          sdk_urls?: Json | null
          status?: string | null
          total_installs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          version?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_documentation_url?: string | null
          auth_type?: string | null
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          developer_id?: string | null
          featured?: boolean | null
          id?: string
          logo_url?: string | null
          name?: string
          pricing_details?: Json | null
          pricing_model?: string | null
          screenshots?: Json | null
          sdk_urls?: Json | null
          status?: string | null
          total_installs?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          version?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      integration_instances: {
        Row: {
          auth_credentials: Json | null
          clinic_id: string
          config: Json
          enabled: boolean | null
          error_message: string | null
          id: string
          installed_at: string | null
          integration_id: string
          last_sync_at: string | null
          next_sync_at: string | null
          status: string | null
          sync_frequency: string | null
          updated_at: string | null
          webhook_events: string[] | null
          webhook_url: string | null
        }
        Insert: {
          auth_credentials?: Json | null
          clinic_id: string
          config?: Json
          enabled?: boolean | null
          error_message?: string | null
          id?: string
          installed_at?: string | null
          integration_id: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          auth_credentials?: Json | null
          clinic_id?: string
          config?: Json
          enabled?: boolean | null
          error_message?: string | null
          id?: string
          installed_at?: string | null
          integration_id?: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_instances_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_instances_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_reviews: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          integration_id: string
          rating: number
          review: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          integration_id: string
          rating: number
          review?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          integration_id?: string
          rating?: number
          review?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_reviews_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          analysis_type: string
          clinic_id: string
          created_at: string
          date: string
          id: string
          patient_name: string
          result: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          clinic_id: string
          created_at?: string
          date: string
          id?: string
          patient_name: string
          result?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          clinic_id?: string
          created_at?: string
          date?: string
          id?: string
          patient_name?: string
          result?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_knowledge: {
        Row: {
          category: string
          confidence_level: number | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          confidence_level?: number | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          confidence_level?: number | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          diagnosis: string
          id: string
          notes: string
          patient_id: string | null
          patient_name: string
          treatment: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          diagnosis?: string
          id?: string
          notes?: string
          patient_id?: string | null
          patient_name: string
          treatment?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          diagnosis?: string
          id?: string
          notes?: string
          patient_id?: string | null
          patient_name?: string
          treatment?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_settings: {
        Row: {
          backup_codes: Json | null
          clinic_id: string | null
          created_at: string
          email_address: string | null
          enabled: boolean | null
          id: string
          last_used_at: string | null
          method: string | null
          phone_number: string | null
          secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: Json | null
          clinic_id?: string | null
          created_at?: string
          email_address?: string | null
          enabled?: boolean | null
          id?: string
          last_used_at?: string | null
          method?: string | null
          phone_number?: string | null
          secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: Json | null
          clinic_id?: string | null
          created_at?: string
          email_address?: string | null
          enabled?: boolean | null
          id?: string
          last_used_at?: string | null
          method?: string | null
          phone_number?: string | null
          secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          integration_instance_id: string
          refresh_token: string | null
          scope: string[] | null
          token_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          integration_instance_id: string
          refresh_token?: string | null
          scope?: string[] | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          integration_instance_id?: string
          refresh_token?: string | null
          scope?: string[] | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_integration_instance_id_fkey"
            columns: ["integration_instance_id"]
            isOneToOne: false
            referencedRelation: "integration_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_feedback: {
        Row: {
          appointment_id: string | null
          clinic_id: string
          created_at: string
          facility_rating: number | null
          id: string
          key_topics: Json | null
          overall_rating: number
          patient_id: string
          provider_rating: number | null
          sentiment_label: string | null
          sentiment_score: number | null
          staff_rating: number | null
          what_could_improve: string | null
          what_went_well: string | null
          would_recommend: boolean | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          facility_rating?: number | null
          id?: string
          key_topics?: Json | null
          overall_rating: number
          patient_id: string
          provider_rating?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          staff_rating?: number | null
          what_could_improve?: string | null
          what_went_well?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          facility_rating?: number | null
          id?: string
          key_topics?: Json | null
          overall_rating?: number
          patient_id?: string
          provider_rating?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          staff_rating?: number | null
          what_could_improve?: string | null
          what_went_well?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_feedback_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_feedback_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_messages: {
        Row: {
          attachments: Json | null
          body: string
          clinic_id: string
          created_at: string
          id: string
          message_type: string
          parent_message_id: string | null
          patient_id: string
          priority: string | null
          provider_id: string | null
          read_at: string | null
          status: string
          subject: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          body: string
          clinic_id: string
          created_at?: string
          id?: string
          message_type: string
          parent_message_id?: string | null
          patient_id: string
          priority?: string | null
          provider_id?: string | null
          read_at?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          body?: string
          clinic_id?: string
          created_at?: string
          id?: string
          message_type?: string
          parent_message_id?: string | null
          patient_id?: string
          priority?: string | null
          provider_id?: string | null
          read_at?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "patient_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_messages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_messages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "mv_provider_performance"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "patient_messages_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "v_provider_performance"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      patient_portal_settings: {
        Row: {
          clinic_id: string
          created_at: string
          email_appointment_reminders: boolean | null
          email_test_results: boolean | null
          enable_appointments: boolean | null
          enable_messaging: boolean | null
          enable_payments: boolean | null
          enable_records_access: boolean | null
          id: string
          patient_id: string
          preferred_language: string | null
          require_2fa: boolean | null
          session_timeout_minutes: number | null
          sms_appointment_reminders: boolean | null
          sms_test_results: boolean | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email_appointment_reminders?: boolean | null
          email_test_results?: boolean | null
          enable_appointments?: boolean | null
          enable_messaging?: boolean | null
          enable_payments?: boolean | null
          enable_records_access?: boolean | null
          id?: string
          patient_id: string
          preferred_language?: string | null
          require_2fa?: boolean | null
          session_timeout_minutes?: number | null
          sms_appointment_reminders?: boolean | null
          sms_test_results?: boolean | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email_appointment_reminders?: boolean | null
          email_test_results?: boolean | null
          enable_appointments?: boolean | null
          enable_messaging?: boolean | null
          enable_payments?: boolean | null
          enable_records_access?: boolean | null
          id?: string
          patient_id?: string
          preferred_language?: string | null
          require_2fa?: boolean | null
          session_timeout_minutes?: number | null
          sms_appointment_reminders?: boolean | null
          sms_test_results?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_portal_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_portal_settings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          allergies: string
          blood_group: string
          clinic_id: string
          created_at: string
          dob: string
          email: string
          id: string
          last_visit: string | null
          name: string
          phone: string
          sex: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string
          blood_group?: string
          clinic_id: string
          created_at?: string
          dob?: string
          email?: string
          id?: string
          last_visit?: string | null
          name: string
          phone?: string
          sex?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string
          blood_group?: string
          clinic_id?: string
          created_at?: string
          dob?: string
          email?: string
          id?: string
          last_visit?: string | null
          name?: string
          phone?: string
          sex?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          clinic_id: string
          created_at: string
          currency: string
          date: string
          description: string
          id: string
          method: string
          patient_id: string | null
          patient_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          clinic_id: string
          created_at?: string
          currency?: string
          date: string
          description?: string
          id?: string
          method?: string
          patient_id?: string | null
          patient_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          clinic_id?: string
          created_at?: string
          currency?: string
          date?: string
          description?: string
          id?: string
          method?: string
          patient_id?: string | null
          patient_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_stock: {
        Row: {
          category: string
          clinic_id: string
          created_at: string
          id: string
          name: string
          price: number
          quantity: number
          threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          clinic_id: string
          created_at?: string
          id?: string
          name: string
          price?: number
          quantity?: number
          threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_stock_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          priority: string
          published_at: string | null
          scheduled_for: string | null
          status: string
          target: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          priority?: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          target?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          priority?: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          target?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          doctor_name: string
          id: string
          medications: string
          notes: string
          patient_id: string | null
          patient_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          doctor_name: string
          id?: string
          medications?: string
          notes?: string
          patient_id?: string | null
          patient_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          doctor_name?: string
          id?: string
          medications?: string
          notes?: string
          patient_id?: string | null
          patient_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          clinic_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          clinic_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          id: string
          request_count: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          request_count?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          request_count?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_tracking_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          clinic_id: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          clinic_id: string | null
          created_at: string
          description: string
          email: string | null
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          clinic_id?: string | null
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          clinic_id?: string | null
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      system_incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          resolved: boolean
          resolved_at: string | null
          service_id: string | null
          service_name: string
          severity: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          service_id?: string | null
          service_name: string
          severity?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          service_id?: string | null
          service_name?: string
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_incidents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_services"
            referencedColumns: ["id"]
          },
        ]
      }
      system_services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_checked_at: string
          latency_ms: number
          name: string
          status: string
          updated_at: string
          uptime_percent: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_checked_at?: string
          latency_ms?: number
          name: string
          status?: string
          updated_at?: string
          uptime_percent?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_checked_at?: string
          latency_ms?: number
          name?: string
          status?: string
          updated_at?: string
          uptime_percent?: number
        }
        Relationships: []
      }
      telemedicine_room_events: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          actual_end: string | null
          clinic_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          reason: string | null
          room_exp: string | null
          room_name: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          session_id: string | null
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          actual_end?: string | null
          clinic_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          reason?: string | null
          room_exp?: string | null
          room_name?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_id?: string | null
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          actual_end?: string | null
          clinic_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          reason?: string | null
          room_exp?: string | null
          room_name?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_room_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_room_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "telemedicine_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          appointment_id: string
          clinic_id: string
          clinical_notes: string | null
          connection_quality: string | null
          consent_recording: boolean | null
          created_at: string
          daily_room_name: string
          daily_room_url: string | null
          diagnosis: string | null
          doctor_id: string | null
          duration_seconds: number | null
          follow_up_actions: Json | null
          id: string
          patient_feedback: string | null
          patient_id: string
          patient_rating: number | null
          provider_id: string
          reason: string | null
          recording_status: string | null
          recording_url: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          technical_issues: Json | null
          treatment_plan: string | null
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_id: string
          clinic_id: string
          clinical_notes?: string | null
          connection_quality?: string | null
          consent_recording?: boolean | null
          created_at?: string
          daily_room_name: string
          daily_room_url?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          duration_seconds?: number | null
          follow_up_actions?: Json | null
          id?: string
          patient_feedback?: string | null
          patient_id: string
          patient_rating?: number | null
          provider_id: string
          reason?: string | null
          recording_status?: string | null
          recording_url?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          technical_issues?: Json | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          appointment_id?: string
          clinic_id?: string
          clinical_notes?: string | null
          connection_quality?: string | null
          consent_recording?: boolean | null
          created_at?: string
          daily_room_name?: string
          daily_room_url?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          duration_seconds?: number | null
          follow_up_actions?: Json | null
          id?: string
          patient_feedback?: string | null
          patient_id?: string
          patient_rating?: number | null
          provider_id?: string
          reason?: string | null
          recording_status?: string | null
          recording_url?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          technical_issues?: Json | null
          treatment_plan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "mv_provider_performance"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "v_provider_performance"
            referencedColumns: ["provider_id"]
          },
          {
            foreignKeyName: "telemedicine_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicine_settings: {
        Row: {
          buffer_time_minutes: number | null
          clinic_id: string
          created_at: string
          enable_chat: boolean | null
          enable_recording: boolean | null
          enable_screen_sharing: boolean | null
          enable_video: boolean | null
          enable_waiting_room: boolean | null
          id: string
          max_session_duration_minutes: number | null
          preferred_video_quality: string | null
          require_consent_for_recording: boolean | null
          updated_at: string
          waiting_room_message: string | null
        }
        Insert: {
          buffer_time_minutes?: number | null
          clinic_id: string
          created_at?: string
          enable_chat?: boolean | null
          enable_recording?: boolean | null
          enable_screen_sharing?: boolean | null
          enable_video?: boolean | null
          enable_waiting_room?: boolean | null
          id?: string
          max_session_duration_minutes?: number | null
          preferred_video_quality?: string | null
          require_consent_for_recording?: boolean | null
          updated_at?: string
          waiting_room_message?: string | null
        }
        Update: {
          buffer_time_minutes?: number | null
          clinic_id?: string
          created_at?: string
          enable_chat?: boolean | null
          enable_recording?: boolean | null
          enable_screen_sharing?: boolean | null
          enable_video?: boolean | null
          enable_waiting_room?: boolean | null
          id?: string
          max_session_duration_minutes?: number | null
          preferred_video_quality?: string | null
          require_consent_for_recording?: boolean | null
          updated_at?: string
          waiting_room_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemedicine_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: true
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_attempts: number | null
          delivery_response: string | null
          delivery_status: string | null
          delivery_url: string
          event_data: Json
          event_type: string
          id: string
          integration_instance_id: string
          last_delivery_attempt: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          delivery_response?: string | null
          delivery_status?: string | null
          delivery_url: string
          event_data?: Json
          event_type: string
          id?: string
          integration_instance_id: string
          last_delivery_attempt?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_attempts?: number | null
          delivery_response?: string | null
          delivery_status?: string | null
          delivery_url?: string
          event_data?: Json
          event_type?: string
          id?: string
          integration_instance_id?: string
          last_delivery_attempt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_integration_instance_id_fkey"
            columns: ["integration_instance_id"]
            isOneToOne: false
            referencedRelation: "integration_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          events: string[]
          id: string
          is_active: boolean | null
          last_delivered_at: string | null
          name: string
          secret: string | null
          total_delivered: number | null
          total_failed: number | null
          updated_at: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          last_delivered_at?: string | null
          name: string
          secret?: string | null
          total_delivered?: number | null
          total_failed?: number | null
          updated_at?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          last_delivered_at?: string | null
          name?: string
          secret?: string | null
          total_delivered?: number | null
          total_failed?: number | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_definitions: {
        Row: {
          category: string | null
          clinic_id: string | null
          created_at: string | null
          created_by: string | null
          definition: Json
          description: string | null
          failed_executions: number | null
          id: string
          last_execution_at: string | null
          name: string
          status: string | null
          successful_executions: number | null
          total_executions: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          definition?: Json
          description?: string | null
          failed_executions?: number | null
          id?: string
          last_execution_at?: string | null
          name: string
          status?: string | null
          successful_executions?: number | null
          total_executions?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          definition?: Json
          description?: string | null
          failed_executions?: number | null
          id?: string
          last_execution_at?: string | null
          name?: string
          status?: string | null
          successful_executions?: number | null
          total_executions?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_definitions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          current_node_id: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          execution_state: Json | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string | null
          trigger_data: Json | null
          trigger_type: string | null
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          current_node_id?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          execution_state?: Json | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          trigger_type?: string | null
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          current_node_id?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          execution_state?: Json | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          trigger_data?: Json | null
          trigger_type?: string | null
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          execution_id: string
          id: string
          level: string | null
          message: string | null
          node_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          execution_id: string
          id?: string
          level?: string | null
          message?: string | null
          node_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          execution_id?: string
          id?: string
          level?: string | null
          message?: string | null
          node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schedules: {
        Row: {
          created_at: string | null
          cron_expression: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          timezone: string | null
          updated_at: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          cron_expression: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          timezone?: string | null
          updated_at?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          timezone?: string | null
          updated_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schedules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string | null
          created_at: string | null
          definition: Json
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          definition?: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          definition?: Json
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      workflow_variables: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
          variable_type: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
          variable_type?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
          variable_type?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_variables_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_api_usage_analytics: {
        Row: {
          api_key_id: string | null
          avg_response_time: number | null
          failed_requests: number | null
          successful_requests: number | null
          total_requests: number | null
          unique_ips: number | null
          usage_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_daily_appointments: {
        Row: {
          cancelled: number | null
          clinic_id: string | null
          completed: number | null
          date: string | null
          no_shows: number | null
          pending: number | null
          total_appointments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_daily_revenue: {
        Row: {
          average_transaction: number | null
          clinic_id: string | null
          currencies: string[] | null
          date: string | null
          total_revenue: number | null
          transaction_count: number | null
          unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_provider_performance: {
        Row: {
          clinic_id: string | null
          completed_appointments: number | null
          completion_rate: number | null
          no_shows: number | null
          provider_id: string | null
          provider_name: string | null
          specialty: string | null
          total_appointments: number | null
          unique_patients_seen: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_workflow_analytics: {
        Row: {
          avg_duration_seconds: number | null
          execution_date: string | null
          failed_executions: number | null
          successful_executions: number | null
          total_duration_seconds: number | null
          total_executions: number | null
          workflow_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_daily_appointments: {
        Row: {
          cancelled: number | null
          clinic_id: string | null
          completed: number | null
          date: string | null
          no_shows: number | null
          pending: number | null
          total_appointments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      v_daily_revenue: {
        Row: {
          average_transaction: number | null
          clinic_id: string | null
          currencies: string[] | null
          date: string | null
          total_revenue: number | null
          transaction_count: number | null
          unique_patients: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      v_provider_performance: {
        Row: {
          clinic_id: string | null
          completed_appointments: number | null
          completion_rate: number | null
          no_shows: number | null
          provider_id: string | null
          provider_name: string | null
          specialty: string | null
          total_appointments: number | null
          unique_patients_seen: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_clinic_invitation: { Args: { _token: string }; Returns: Json }
      calculate_next_run_time: {
        Args: { cron_expression: string; timezone?: string }
        Returns: string
      }
      check_rate_limit: {
        Args: { api_key_id: string; window_minutes?: number }
        Returns: boolean
      }
      complete_workflow_execution: {
        Args: {
          p_error_details?: Json
          p_error_message?: string
          p_execution_id: string
          p_output_data?: Json
          p_status: string
        }
        Returns: undefined
      }
      create_security_event: {
        Args: {
          p_clinic_id?: string
          p_details?: Json
          p_event_type: string
          p_severity: string
          p_user_id?: string
        }
        Returns: string
      }
      create_telemedicine_session: {
        Args: {
          p_appointment_id: string
          p_clinic_id: string
          p_patient_id: string
          p_provider_id: string
          p_scheduled_end: string
          p_scheduled_start: string
        }
        Returns: string
      }
      create_workflow_execution: {
        Args: {
          p_input_data?: Json
          p_trigger_data?: Json
          p_trigger_type: string
          p_triggered_by?: string
          p_workflow_id: string
        }
        Returns: string
      }
      decrypt_data: {
        Args: { encrypted_data: string; secret_key: string }
        Returns: string
      }
      disable_mfa: { Args: { p_user_id: string }; Returns: boolean }
      enable_mfa: {
        Args: {
          p_backup_codes: string[]
          p_method: string
          p_secret: string
          p_user_id: string
        }
        Returns: boolean
      }
      encrypt_data: {
        Args: { data: string; secret_key: string }
        Returns: string
      }
      generate_api_key: { Args: never; Returns: string }
      generate_appointment_reminders: { Args: never; Returns: number }
      get_api_usage_summary: {
        Args: { api_key_id_param: string; days?: number }
        Returns: {
          avg_response_time: number
          success_rate: number
          total_requests: number
          unique_ips: number
        }[]
      }
      get_clinic_analytics_summary: {
        Args: {
          p_clinic_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_clinic_audit_logs: {
        Args: { p_clinic_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          action: string
          created_at: string
          id: string
          resource_id: string
          resource_type: string
          success: boolean
          user_id: string
          user_type: string
        }[]
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          clinic_id: string
          clinic_name: string
          email: string
          expires_at: string
          id: string
          invited_by_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      get_patient_message_threads: {
        Args: { p_patient_id: string }
        Returns: {
          last_message_at: string
          message_count: number
          message_type: string
          priority: string
          status: string
          subject: string
          thread_id: string
          unread_count: number
        }[]
      }
      get_workflow_analytics: {
        Args: { days?: number; workflow_id_param: string }
        Returns: {
          avg_duration_seconds: number
          failed_executions: number
          success_rate: number
          successful_executions: number
          total_executions: number
        }[]
      }
      has_clinic_role: {
        Args: {
          _clinic_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_api_key: { Args: { api_key: string }; Returns: string }
      increment_install_count: {
        Args: { integration_id_param: string }
        Returns: undefined
      }
      increment_template_usage: {
        Args: { template_id_param: string }
        Returns: undefined
      }
      is_clinic_member: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      log_api_request: {
        Args: {
          p_api_key_id: string
          p_ip_address: string
          p_method: string
          p_path: string
          p_query_params?: Json
          p_request_body?: Json
          p_response_body?: Json
          p_response_time_ms: number
          p_status_code: number
          p_user_agent: string
          p_version?: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_changes?: Json
          p_clinic_id?: string
          p_error_message?: string
          p_resource_id?: string
          p_resource_type: string
          p_success?: boolean
          p_user_id?: string
          p_user_type?: string
        }
        Returns: string
      }
      log_workflow_event: {
        Args: {
          p_data?: Json
          p_execution_id: string
          p_level: string
          p_message: string
          p_node_id?: string
        }
        Returns: string
      }
      mark_message_as_read: { Args: { p_message_id: string }; Returns: boolean }
      refresh_analytics_views: { Args: never; Returns: undefined }
      refresh_api_usage_analytics: { Args: never; Returns: undefined }
      refresh_workflow_analytics: { Args: never; Returns: undefined }
      retry_failed_webhook: { Args: { event_id: string }; Returns: boolean }
      revoke_clinic_invitation: { Args: { _id: string }; Returns: Json }
      search_medical_knowledge: {
        Args: {
          category_filter?: string
          limit_count?: number
          query_embedding: string
        }
        Returns: {
          category: string
          confidence_level: number
          content: string
          id: string
          similarity: number
          source: string
          title: string
        }[]
      }
      track_analytics_event: {
        Args: {
          p_clinic_id: string
          p_event_category: string
          p_event_name: string
          p_event_properties?: Json
          p_page_url?: string
          p_user_id?: string
          p_user_type?: string
        }
        Returns: string
      }
      update_integration_rating: {
        Args: { integration_id_param: string }
        Returns: undefined
      }
      update_telemedicine_session_status: {
        Args: {
          p_actual_end?: string
          p_actual_start?: string
          p_session_id: string
          p_status: string
        }
        Returns: boolean
      }
      update_workflow_schedule: {
        Args: { schedule_id_param: string }
        Returns: undefined
      }
      user_clinic_ids: { Args: { _user_id: string }; Returns: string[] }
      validate_api_key: {
        Args: { api_key_param: string }
        Returns: {
          api_key_id: string
          clinic_id: string
          is_active: boolean
          is_expired: boolean
          is_valid: boolean
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "medecin" | "secretaire" | "infirmier" | "super_admin"
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
      app_role: ["admin", "medecin", "secretaire", "infirmier", "super_admin"],
    },
  },
} as const
