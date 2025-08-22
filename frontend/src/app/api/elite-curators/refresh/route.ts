import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/elite-curators/refresh - Smart refresh (1K followers only)
export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  
  try {
    const user = await db.user.findUnique({ 
      where: { id: user_id }
    });
    
    console.log('Found user for refresh:', user);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!user.twitterId) {
      return NextResponse.json({ error: 'User has no Twitter ID' }, { status: 404 });
    }
    
         // Fetch full followers list for comprehensive refresh
     const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
     const followersResponse = await fetch(
       `${API_BASE}/twitter/followers?username=${user.twitterId}&followers=${user.followersCount || 5000}`
     );
    
    if (!followersResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
    }
    
    const followersData = await followersResponse.json();
    const latestFollowers = followersData.followers || [];
    
    // Get all elite curators from database
    const allEliteCurators = await db.eliteCurator.findMany();
    const eliteUsernames = new Set(allEliteCurators.map(ec => ec.username));
    
         // Find all elite curators in full followers list
     const foundEliteCurators = latestFollowers.filter((follower: { username: string }) => 
       eliteUsernames.has(follower.username)
     );
     
     // Get elite curator IDs for all matches
     const foundEliteCuratorIds = allEliteCurators
       .filter(ec => foundEliteCurators.some((f: { username: string }) => f.username === ec.username))
       .map(ec => ec.id);
     
     // First, remove all existing elite curator connections for this user
     await db.$executeRaw`
       DELETE FROM "_UserToelite_curators" 
       WHERE "A" = ${String(user_id)}
     `;
     
     // Then, add all current elite curators from the full followers list
     if (foundEliteCuratorIds.length > 0) {
       for (const eliteId of foundEliteCuratorIds) {
         await db.$executeRaw`
           INSERT INTO "_UserToelite_curators" ("A", "B") 
           VALUES (${String(user_id)}, ${eliteId})
         `;
       }
     }
           
                        // Get updated count using raw query
             const eliteCurators = await db.$queryRaw<any[]>`
               SELECT ec.* FROM elite_curators ec
               INNER JOIN "_UserToelite_curators" utc ON ec.id = utc."B"
               WHERE utc."A" = ${String(user_id)}
             `;
             
             const count = eliteCurators.length;
             const eliteCuratorIds = eliteCurators.map((ec: any) => ec.id);
    
         return NextResponse.json({
       count,
       eliteCuratorIds,
       newEliteCuratorsFound: foundEliteCuratorIds.length,
       message: `Refresh completed. Found ${foundEliteCuratorIds.length} elite curators in your followers.`
     });
    
  } catch (error) {
    console.error('Error refreshing elite curators:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh elite curators',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
