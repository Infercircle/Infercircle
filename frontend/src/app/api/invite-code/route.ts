import { findInviteCode, updateInviteCode, updateUserInvite } from "@/actions/queries";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOption";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { code } = await request.json();
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!code) {
        return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }
    
    try {
        const inviteCode = await findInviteCode(code);
        
        if (!inviteCode) {
            return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
        }

        if (inviteCode.used) {
            return NextResponse.json({ error: "Invite code already used" }, { status: 400 });
        }

        // Mark the invite code as used
        await updateInviteCode(code, true);

        await updateUserInvite(session.user.id, true);
    
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error processing invite code:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}