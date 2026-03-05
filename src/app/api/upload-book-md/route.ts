import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface UploadBookMdRequest {
    title: string;
    author: string;
    isbn?: string;
    publisher?: string;
    year?: number | string;
    subject?: string;
    type?: string;
    level?: string[];
    description?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as UploadBookMdRequest;
        const {
            title,
            author,
            isbn,
            publisher,
            year,
            subject,
            type,
            level,
            description,
        } = body;

        if (!title) {
            return NextResponse.json({
                success: false,
                error: "Title is required",
            }, { status: 400 });
        }

        const { env } = await getCloudflareContext({ async: true });
        if (!env || !env.BOOK_MD_BUCKET) {
            console.warn(
                "[Upload Book MD] BOOK_MD_BUCKET binding not found. Skipping R2 upload.",
            );
            return NextResponse.json({
                success: true,
                warning: "Bucket not configured",
            });
        }

        const mdContent = [
            `# ${title}`,
            ``,
            `**Autor:** ${author || "Unbekannt"}`,
            `**ISBN:** ${isbn || "Unbekannt"}`,
            `**Verlag:** ${publisher || "Unbekannt"}`,
            `**Erscheinungsjahr:** ${year || "Unbekannt"}`,
            `**Fach:** ${subject || "Unbekannt"}`,
            `**Typ:** ${type || "Unbekannt"}`,
            `**Stufe:** ${
                level && Array.isArray(level) && level.length > 0
                    ? level.join(", ")
                    : "Unbekannt"
            }`,
            ``,
            `## Beschreibung`,
            description || "Keine Beschreibung verfügbar.",
        ].join("\n");

        const safeTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9äöüß]+/g, "-")
            .replace(/(^-|-$)/g, "");
        const safeIsbn = (isbn || "").replace(/[^0-9X-]/gi, "");

        const filename = `${safeIsbn ? safeIsbn + "-" : "noisbn-"}${
            safeTitle || Date.now()
        }.md`;

        console.log(
            `[Upload Book MD] Uploading markdown to R2 bucket as: ${filename}`,
        );

        await env.BOOK_MD_BUCKET.put(filename, mdContent, {
            httpMetadata: { contentType: "text/markdown; charset=utf-8" },
        });
        console.log(`[Upload Book MD] Upload successful`);

        return NextResponse.json({ success: true, filename });
    } catch (error) {
        console.error("[Upload Book MD] Error:", error);
        return NextResponse.json({ success: false, error: "Upload failed" }, {
            status: 500,
        });
    }
}
