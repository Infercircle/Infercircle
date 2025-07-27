import { Router, Request, Response } from "express";
import axios from "axios";
import { asyncHandler } from "../lib/helper";

const router = Router();

// Proxy to Helper API for ARKM balances
router.get("/address/:address", asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!process.env.HELPER_APIS_URL) {
    return res.status(500).json({ error: "HELPER_APIS_URL is not defined in environment variables" });
  }
  try {
    const response = await axios.get(`${process.env.HELPER_APIS_URL}/balances/address/${address}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data || "Helper API request failed",
      });
    } else {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  }
}));

export default router; 