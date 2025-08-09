import { getEliteUsers } from "@/actions/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const eliteUsers = await getEliteUsers();
        return NextResponse.json(eliteUsers, {status: 200});
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch elite users" }, {
            status: 500,
        });
    }
}