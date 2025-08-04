import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOption';
import { generateInviteCode, getAllInviteCodes } from '@/actions/queries';

const AUTHORIZED_EMAILS = ['Infercircle@gmail.com', 'kesharwanis084@gmail.com'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    if (!AUTHORIZED_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Invalid email' }, { status: 403 });
    }

    const { email, username } = await request.json();

    // Generate a unique invite code
    const inviteCode = await generateInviteCode(email || null, username || null);

    return NextResponse.json({ 
      success: true, 
      inviteCode: inviteCode.InviteCode,
      message: 'Invite code generated successfully' 
    });

  } catch (error) {
    console.error('Error generating invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    if (!AUTHORIZED_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized - Invalid email' }, { status: 403 });
    }

    const inviteCodes = await getAllInviteCodes();

    return NextResponse.json({ inviteCodes });

  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
