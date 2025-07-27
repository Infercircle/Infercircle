import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import { UserWalletService } from "../services/supabase";
import axios from "axios";

const router = Router();
const userWalletService = new UserWalletService();

// POST /userwallets - Add a wallet for the user
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id, wallet_address, chain } = req.body;
  if (!twitter_id || !wallet_address || !chain) {
    return res.status(400).json({ error: "twitter_id, wallet_address, and chain are required" });
  }
  // Save wallet
  const wallet = await userWalletService.addWallet({ twitter_id, wallet_address, chain });
  if (!wallet) {
    return res.status(500).json({ error: "Failed to save wallet" });
  }
  // Fetch balance from helper API
  let balance = null;
  try {
    const helperUrl = process.env.HELPER_APIS_URL || "https://helper-apis-and-scrappers.onrender.com";
    const response = await axios.get(`${helperUrl}/balances/address/${wallet_address}`);
    balance = response.data;
  } catch (e) {
    balance = null;
  }
  res.json({ wallet, balance });
}));

// GET /userwallets/:twitter_id - Get all wallets for a user
router.get("/:twitter_id", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id } = req.params;
  if (!twitter_id) {
    return res.status(400).json({ error: "twitter_id is required" });
  }
  const wallets = await userWalletService.getWalletsByTwitterId(twitter_id);
  res.json({ wallets });
}));

// DELETE /userwallets - Remove a wallet for the user
router.delete("/", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id, wallet_address, chain } = req.body;
  if (!twitter_id || !wallet_address || !chain) {
    return res.status(400).json({ error: "twitter_id, wallet_address, and chain are required" });
  }
  const { error } = await userWalletService.deleteWallet(twitter_id, wallet_address, chain);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
}));

// PUT /userwallets - Update a wallet for the user
router.put("/", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id, old_wallet_address, new_wallet_address, chain } = req.body;
  if (!twitter_id || !old_wallet_address || !new_wallet_address || !chain) {
    return res.status(400).json({ error: "twitter_id, old_wallet_address, new_wallet_address, and chain are required" });
  }
  const { error } = await userWalletService.updateWallet(twitter_id, old_wallet_address, new_wallet_address, chain);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
}));

export default router; 