import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, contentId, contentType, summary, transcript } = body as {
      user_id: string
      contentId: string
      contentType: 'space' | 'broadcast'
      summary: string
      transcript: string
    }

    if (!user_id || !contentId || !contentType || !summary || !transcript) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await db.contentSummary.upsert({
      where: { ContentId: contentId },
      create: {
        ContentId: contentId,
        ContentType: contentType,
        Summary: summary,
        Transcript: transcript,
      },
      update: {
        Summary: summary,
        Transcript: transcript,
      },
    })

    await db.userContentSummary.upsert({
      where: { userId_contentId: { userId: user_id, contentId } },
      create: { 
        id: `${user_id}-${contentId}`,
        userId: user_id, 
        contentId 
      },
      update: {},
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const contentId = searchParams.get('contentId')
    const contentType = searchParams.get('contentType') as 'space' | 'broadcast' | null
    const type = searchParams.get('type') as 'space' | 'broadcast' | null
    const take = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const skip = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    // If searching by specific contentId and contentType, query ContentSummary directly
    if (contentId && contentType) {
      const contentSummary = await db.contentSummary.findFirst({
        where: { 
          ContentId: contentId,
          ContentType: contentType
        }
      })

      if (contentSummary) {
        const data = [{
          contentId: contentSummary.ContentId,
          contentType: contentSummary.ContentType,
          summary: contentSummary.Summary,
          transcript: contentSummary.Transcript,
          createdAt: contentSummary.CreatedAt,
        }]
        return NextResponse.json({ history: data, count: data.length })
      } else {
        return NextResponse.json({ history: [], count: 0 })
      }
    }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const items: any[] = await db.userContentSummary.findMany({
      where: { userId: user_id },
      include: { ContentSummary: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    })

    const filtered = type
      ? items.filter((u: any) => u.ContentSummary?.ContentType === type)
      : items

    const data = filtered.map((u: any) => ({
      contentId: u.contentId,
      contentType: u.ContentSummary?.ContentType,
      summary: u.ContentSummary?.Summary,
      transcript: u.ContentSummary?.Transcript,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ history: data, count: data.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const contentId = searchParams.get('contentId')

    if (!user_id || !contentId) {
      return NextResponse.json({ error: 'user_id and contentId are required' }, { status: 400 })
    }

    // Delete the user-content relationship
    await db.userContentSummary.delete({
      where: { userId_contentId: { userId: user_id, contentId } }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}