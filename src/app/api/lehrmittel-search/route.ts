import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    
    if (!env.AI) {
      return NextResponse.json(
        { error: 'AI binding not found' }, 
        { status: 500 }
      );
    }

    const body = await request.json() as { query: string };
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // The project name "snowy-hat-052d" comes from the user's request
    // @ts-ignore - AI type is 'any' currently
    const answer = await env.AI.autorag("snowy-hat-052d").aiSearch({
      query: query,
    });

    return NextResponse.json({ success: true, data: answer });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during search' },
      { status: 500 }
    );
  }
}

