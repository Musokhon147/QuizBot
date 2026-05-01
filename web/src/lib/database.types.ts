export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      attempts: {
        Row: {
          answers: Json;
          created_at: string | null;
          duration_ms: number | null;
          id: string;
          score: number;
          telegram_user_id: string;
          test_id: string | null;
          time_per_question: number | null;
          total_questions: number;
        };
        Insert: {
          answers: Json;
          created_at?: string | null;
          duration_ms?: number | null;
          id?: string;
          score: number;
          telegram_user_id: string;
          test_id?: string | null;
          time_per_question?: number | null;
          total_questions: number;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
      bookmarks: {
        Row: {
          created_at: string | null;
          question_id: string;
          telegram_user_id: string;
        };
        Insert: {
          created_at?: string | null;
          question_id: string;
          telegram_user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Insert"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          correct_answer: string;
          difficulty: string | null;
          explanation: string | null;
          id: string;
          options: Json;
          question_number: number;
          question_text: string;
          test_id: string | null;
        };
        Insert: {
          correct_answer: string;
          difficulty?: string | null;
          explanation?: string | null;
          id?: string;
          options: Json;
          question_number: number;
          question_text: string;
          test_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      tests: {
        Row: {
          category: string | null;
          created_at: string | null;
          id: string;
          telegram_user_id: string;
          title: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          telegram_user_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tests"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          joined_at: string | null;
          language: string | null;
          last_active: string | null;
          name: string | null;
          phone: string | null;
          telegram_id: string;
          theme: string | null;
          username: string | null;
        };
        Insert: {
          joined_at?: string | null;
          language?: string | null;
          last_active?: string | null;
          name?: string | null;
          phone?: string | null;
          telegram_id: string;
          theme?: string | null;
          username?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          attempts: number | null;
          avg_pct: number | null;
          name: string | null;
          score_index: number | null;
          telegram_id: string | null;
          total_correct: number | null;
          username: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      user_streak: { Args: { uid: string }; Returns: number };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
