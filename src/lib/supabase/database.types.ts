export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            global_books: {
                Row: {
                    id: string;
                    isbn: string | null;
                    title: string;
                    author: string;
                    publisher: string | null;
                    subject: string | null;
                    description: string | null;
                    year: number | null;
                    level: string[] | null;
                    type: string | null;
                    cover_image: string | null;
                    created_at: string;
                    updated_at?: string;
                };
                Insert: {
                    id?: string;
                    isbn?: string | null;
                    title: string;
                    author: string;
                    publisher?: string | null;
                    subject?: string | null;
                    description?: string | null;
                    year?: number | null;
                    level?: string | null;
                    type?: string | null;
                    cover_image?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    isbn?: string | null;
                    title?: string;
                    author?: string;
                    publisher?: string | null;
                    subject?: string | null;
                    description?: string | null;
                    year?: number | null;
                    level?: string | null;
                    type?: string | null;
                    cover_image?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            organization_inventory: {
                Row: {
                    id: string;
                    organization_id: string;
                    global_book_id: string;
                    location: string | null;
                    available: boolean;
                    has_pdf: boolean;
                    borrowed_by: string | null;
                    borrowed_at: string | null;
                    created_at: string;
                    updated_at?: string;
                    user_id: string | null;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    global_book_id: string;
                    location?: string | null;
                    available?: boolean;
                    has_pdf?: boolean;
                    borrowed_by?: string | null;
                    borrowed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    global_book_id?: string;
                    location?: string | null;
                    available?: boolean;
                    has_pdf?: boolean;
                    borrowed_by?: string | null;
                    borrowed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    user_id?: string | null;
                };
            };
            audit_logs: {
                Row: {
                    id: string;
                    table_name: string;
                    record_id: string | null;
                    operation: string;
                    old_data: Json | null;
                    new_data: Json | null;
                    changed_by: string | null;
                    organization_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    table_name: string;
                    record_id?: string | null;
                    operation: string;
                    old_data?: Json | null;
                    new_data?: Json | null;
                    changed_by?: string | null;
                    organization_id?: string | null;
                    created_at?: string;
                };
                // eslint-disable-next-line @typescript-eslint/no-empty-object-type
                Update: {
                    // Logs usually immutable
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}
