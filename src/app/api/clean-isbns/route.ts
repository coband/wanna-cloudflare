import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({
                error:
                    "Missing Supabase env vars, ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set",
            }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: books, error: fetchError } = await supabase
            .from("global_books")
            .select("id, isbn")
            .not("isbn", "is", null);

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, {
                status: 500,
            });
        }

        const updates = [];

        for (const book of books) {
            if (book.isbn && /[-\s]/.test(book.isbn)) {
                const cleanIsbn = book.isbn.replace(/[-\s]/g, "");
                updates.push({
                    id: book.id,
                    isbn: cleanIsbn,
                    oldIsbn: book.isbn,
                });
            }
        }

        const results = [];
        for (const update of updates) {
            const { error } = await supabase
                .from("global_books")
                .update({ isbn: update.isbn })
                .eq("id", update.id);

            if (error) {
                results.push({
                    id: update.id,
                    old: update.oldIsbn,
                    new: update.isbn,
                    status: "error",
                    message: error.message,
                });
            } else {
                results.push({
                    id: update.id,
                    old: update.oldIsbn,
                    new: update.isbn,
                    status: "success",
                });
            }
        }

        return NextResponse.json({
            message: "ISBN cleanup finished",
            totalBooksCheck: books.length,
            booksNeedingUpdate: updates.length,
            results,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
