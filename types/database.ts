export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContractStatus =
  | 'intake'
  | 'in_progress'
  | 'review'
  | 'ready'
  | 'submitted';

export type FormStatus =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'complete';

export interface Database {
  public: {
    Enums: {
      contract_status: ContractStatus;
      form_status: FormStatus;
    };
    Tables: {
      contracts: {
        Row: {
          id: string;
          title: string;
          agency: string;
          due_date: string;
          status: ContractStatus;
          progress: number;
          slack_thread_ts: string | null;
          sam_notice_id: string | null;
          solicitation_number: string | null;
          sam_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          agency: string;
          due_date: string;
          status?: ContractStatus;
          progress?: number;
          slack_thread_ts?: string | null;
          sam_notice_id?: string | null;
          solicitation_number?: string | null;
          sam_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          agency?: string;
          due_date?: string;
          status?: ContractStatus;
          progress?: number;
          slack_thread_ts?: string | null;
          sam_notice_id?: string | null;
          solicitation_number?: string | null;
          sam_url?: string | null;
          created_at?: string;
        };
      };
      forms: {
        Row: {
          id: string;
          contract_id: string;
          name: string;
          description: string | null;
          notes: string | null;
          assigned_to: string | null;
          status: FormStatus;
          due_date: string | null;
          weight: number;
          created_at: string;
          completed_at: string | null;
          slack_requested_at: string | null;
        };
        Insert: {
          id?: string;
          contract_id: string;
          name: string;
          description?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          status?: FormStatus;
          due_date?: string | null;
          weight?: number;
          created_at?: string;
          completed_at?: string | null;
          slack_requested_at?: string | null;
        };
        Update: {
          id?: string;
          contract_id?: string;
          name?: string;
          description?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
          status?: FormStatus;
          due_date?: string | null;
          weight?: number;
          created_at?: string;
          completed_at?: string | null;
          slack_requested_at?: string | null;
        };
      };
      documents: {
        Row: {
          id: string;
          form_id: string;
          file_url: string;
          file_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          file_url: string;
          file_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          file_url?: string;
          file_name?: string;
          created_at?: string;
        };
      };
    };
  };
}
