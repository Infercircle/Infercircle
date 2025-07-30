import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/wallets - Add a wallet for the user
export async function POST(req: NextRequest) {
  const { user_id, wallet_address, chain } = await req.json();
  if (!user_id || !wallet_address || !chain) {
    return NextResponse.json({ error: 'user_id, wallet_address, and chain are required' }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  let wallet = await db.userWallet.findFirst({ where: { walletAddress: wallet_address, chain } });
  if (wallet) {
    wallet = await db.userWallet.update({
      where: { id: wallet.id },
      data: { users: { connect: { id: user.id } } },
      include: { users: true },
    });
  } else {
    wallet = await db.userWallet.create({
      data: {
        walletAddress: wallet_address,
        chain,
        users: { connect: { id: user.id } },
      },
      include: { users: true },
    });
  }
  return NextResponse.json({ wallet });
}

// GET /api/wallets?user_id=... - Get all wallets for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ wallets: [] });
  const wallets = await db.userWallet.findMany({
    where: { users: { some: { id: user.id } } },
  });
  return NextResponse.json({ wallets });
}

// DELETE /api/wallets - Remove a wallet for the user
export async function DELETE(req: NextRequest) {
  const { user_id, wallet_address, chain } = await req.json();
  if (!user_id || !wallet_address || !chain) {
    return NextResponse.json({ error: 'user_id, wallet_address, and chain are required' }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const wallet = await db.userWallet.findFirst({ where: { walletAddress: wallet_address, chain } });
  if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
  await db.userWallet.update({
    where: { id: wallet.id },
    data: { users: { disconnect: { id: user.id } } },
  });
  return NextResponse.json({ success: true });
}

// PUT /api/wallets - Update a wallet address for a user
export async function PUT(req: NextRequest) {
  const { user_id, old_wallet_address, new_wallet_address, chain } = await req.json();
  if (!user_id || !old_wallet_address || !new_wallet_address || !chain) {
    return NextResponse.json({ error: 'user_id, old_wallet_address, new_wallet_address, and chain are required' }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const oldWallet = await db.userWallet.findFirst({ where: { walletAddress: old_wallet_address, chain } });
  if (oldWallet) {
    await db.userWallet.update({
      where: { id: oldWallet.id },
      data: { users: { disconnect: { id: user.id } } },
    });
  }
  let newWallet = await db.userWallet.findFirst({ where: { walletAddress: new_wallet_address, chain } });
  if (newWallet) {
    await db.userWallet.update({
      where: { id: newWallet.id },
      data: { users: { connect: { id: user.id } } },
    });
  } else {
    await db.userWallet.create({
      data: {
        walletAddress: new_wallet_address,
        chain,
        users: { connect: { id: user.id } },
      },
    });
  }
  return NextResponse.json({ success: true });
} 