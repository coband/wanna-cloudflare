import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface DeleteBookMdRequest {
    title: string;
    isbn?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as DeleteBookMdRequest;
        const { title, isbn } = body;

        if (!title) {
            return NextResponse.json({
                success: false,
                error: "Title is required",
            }, { status: 400 });
        }

        const { env } = await getCloudflareContext({ async: true });
        if (!env || !env.BOOK_MD_BUCKET) {
            console.warn(
                "[Delete Book MD] BOOK_MD_BUCKET binding not found. Skipping R2 deletion.",
            );
            return NextResponse.json({
                success: true,
                warning: "Bucket not configured",
            });
        }

        const safeTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9äöüß]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const safeIsbn = (isbn || "").replace(/[^0-9X-]/gi, "");

        const filename = `${safeIsbn ? safeIsbn + "-" : "noisbn-"}${
            safeTitle || ""
        }.md`;

        console.log(
            `[Delete Book MD] Deleting markdown from R2 bucket: ${filename}`,
        );

        await env.BOOK_MD_BUCKET.delete(filename);
        console.log(`[Delete Book MD] Deletion successful`);

        return NextResponse.json({ success: true, filename });
    } catch (error) {
        console.error("[Delete Book MD] Error:", error);
        return NextResponse.json({ success: false, error: "Deletion failed" }, {
            status: 500,
        });
    }
}
