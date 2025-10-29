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

    // Transform Zerion portfolio response to simplified shape expected by frontend
    const payload: any = response.data;
    const attributes: any = payload?.data?.attributes || {};

    const positionsByChain = attributes.positions_distribution_by_chain || {};
    const positionsByType = attributes.positions_distribution_by_type || {};
    const chains: Record<string, { name: string; iconUrl?: string }> = {};
    Object.keys(positionsByChain).forEach((chainId) => {
      const name = chainId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      chains[chainId] = { name };
    });

    const totalValue = Object.values(positionsByType).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0);
    const change24hRelative = attributes?.changes?.percent_1d ?? 0;

    const simplified = {
      totalValue,
      change24h: { relative: change24hRelative },
      chains,
      positionsChainsDistribution: positionsByChain,
    };

    res.status(200).json({ data: simplified });
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

    // Transform Zerion positions response into simplified array shape
    const payload: any = response.data;
    const items: any[] = Array.isArray(payload?.data) ? payload.data : [];

    const simplified = items.map((item: any) => {
      const a = item?.attributes || {};
      const chainId = a?.chain_id || a?.chain || 'ethereum';
      const chainName = (a?.chain_name || chainId).toString().replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      const asset = a?.asset || {};
      const implementations = (asset?.implementations || {}) as Record<string, any>;
      if (!implementations[chainId]) implementations[chainId] = { decimals: 18 };

      const iconUrl = asset?.icon_url || asset?.iconUrl || undefined;
      const priceValue = asset?.price?.value ?? a?.price ?? 0;
      const priceChange = asset?.price?.relativeChange24h ?? a?.changes?.percent_1d ?? 0;

      // quantity in base units for frontend parsing
      const quantity = a?.quantity?.int ?? a?.quantity ?? '0';

      return {
        isDisplayable: (a?.value ?? 0) > 0,
        value: a?.value ?? 0,
        quantity,
        chain: { id: chainId, name: chainName },
        asset: {
          name: asset?.name || a?.name || '',
          symbol: asset?.symbol || a?.symbol || '',
          iconUrl,
          price: {
            value: priceValue,
            relativeChange24h: priceChange,
          },
          implementations,
        },
      };
    });

    res.status(200).json({ data: simplified });
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