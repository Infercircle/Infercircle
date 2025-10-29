import { Router, Request, Response } from "express";
import axios from "axios";
import { asyncHandler } from "../lib/helper";

const router = Router();

const ZERION_API_BASE = process.env.ZERION_API_BASE || "https://api.zerion.io";
const ZERION_API_KEY = process.env.ZERION_API_KEY;

function getZerionHeaders() {
  if (!ZERION_API_KEY) {
    return null;
  }
  const basicToken = Buffer.from(`${ZERION_API_KEY}:`).toString("base64");
  return {
    Authorization: `Basic ${basicToken}`,
    Accept: "application/json",
  } as Record<string, string>;
}

// Balances/portfolio summary for an address via Zerion API
router.get("/address/:address", asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const headers = getZerionHeaders();

  if (!headers) {
    return res.status(500).json({ error: "ZERION_API_KEY is not configured" });
  }

  try {
    const response = await axios.get(
      `${ZERION_API_BASE}/v1/wallets/${address}/portfolio`,
      { headers, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data || "Zerion API request failed",
      });
    } else {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  }
}));

// Zerion portfolio endpoint passthrough
router.get("/portfolio/:address", asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const headers = getZerionHeaders();

  if (!headers) {
    return res.status(500).json({ error: "ZERION_API_KEY is not configured" });
  }

  try {
    const response = await axios.get(
      `${ZERION_API_BASE}/v1/wallets/${address}/portfolio`,
      { headers, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data || "Zerion API request failed",
      });
    } else {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  }
}));

// Zerion positions endpoint passthrough
router.get("/positions/:address", asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const headers = getZerionHeaders();

  if (!headers) {
    return res.status(500).json({ error: "ZERION_API_KEY is not configured" });
  }

  try {
    const response = await axios.get(
      `${ZERION_API_BASE}/v1/wallets/${address}/positions`,
      { headers, params: req.query }
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data || "Zerion API request failed",
      });
    } else {
      res.status(500).json({ error: error.message || "Unknown error" });
    }
  }
}));

export default router;