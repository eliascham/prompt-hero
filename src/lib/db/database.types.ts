// Generated Supabase database types (manual for now — can be regenerated via supabase gen types)

export interface Database {
  public: {
    Tables: {
      challenges: {
        Row: {
          id: string;
          title: string;
          difficulty: string | null;
          tags: string[] | null;
          truth_spec: Record<string, unknown>;
          ai_brief: Record<string, unknown>;
          starter_code: Record<string, string> | null;
          meta: Record<string, unknown> | null;
        };
        Insert: {
          id: string;
          title: string;
          difficulty?: string | null;
          tags?: string[] | null;
          truth_spec: Record<string, unknown>;
          ai_brief: Record<string, unknown>;
          starter_code?: Record<string, string> | null;
          meta?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["challenges"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string | null;
          challenge_id: string;
          status: string;
          reveals_used: number;
          max_reveals: number;
          messages: Record<string, unknown>[];
          tool_calls: Record<string, unknown>[];
          test_results: Record<string, unknown>[];
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          challenge_id: string;
          status?: string;
          reveals_used?: number;
          max_reveals?: number;
          messages?: Record<string, unknown>[];
          tool_calls?: Record<string, unknown>[];
          test_results?: Record<string, unknown>[];
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      scores: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          challenge_id: string;
          correctness: number | null;
          intervention_efficiency: number | null;
          diagnosis_quality: number | null;
          total_score: number | null;
          post_mortem: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          challenge_id: string;
          correctness?: number | null;
          intervention_efficiency?: number | null;
          diagnosis_quality?: number | null;
          total_score?: number | null;
          post_mortem?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scores"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
