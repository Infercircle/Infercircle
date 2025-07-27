import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import { EliteCuratorsService } from "../services/eliteCuratorsService";
import axios from 'axios';

const router = Router();
const eliteCuratorsService = new EliteCuratorsService();

// Health check for Elite Curators automation
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    message: "Elite Curators Service is running",
    timestamp: new Date().toISOString()
  });
});

// Start automation (POST to start, DELETE to stop)
router.post("/start", asyncHandler(async (req: Request, res: Response) => {
  // Start automation in background
  eliteCuratorsService.runAutomation().catch(error => {
    console.error('Automation error:', error);
  });

  res.json({
    status: "success",
    message: "Elite Curators automation started",
    timestamp: new Date().toISOString()
  });
}));

// Get summary statistics
router.get("/summary", asyncHandler(async (req: Request, res: Response) => {
  const summary = await eliteCuratorsService.getSummary();
  
  res.json({
    status: "success",
    data: summary
  });
}));

// Get all top elite curators
router.get("/top-curators", asyncHandler(async (req: Request, res: Response) => {
  const curators = await eliteCuratorsService.getTopEliteCurators();

  res.json({
    status: "success",
    count: curators.length,
    data: curators
  });
}));

// Get all elite curators (with optional limit)
router.get("/curators", asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const curators = await eliteCuratorsService.getEliteCurators(limit);

  res.json({
    status: "success",
    count: curators.length,
    data: curators
  });
}));

// Add new top elite curator
router.post("/top-curators", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id, username } = req.body;

  if (!twitter_id || !username) {
    return res.status(400).json({
      status: "error",
      message: "twitter_id and username are required"
    });
  }

  const curator = await eliteCuratorsService.addTopEliteCurator(twitter_id, username);

  res.json({
    status: "success",
    message: `Added top elite curator: ${username}`,
    data: curator
  });
}));

// Process a specific curator manually
router.post("/process/:twitter_id", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      status: "error",
      message: "username is required in request body"
    });
  }

  const result = await eliteCuratorsService.processCurator(twitter_id, username);

  res.json({
    status: "success",
    message: `Processing completed for ${username}`,
    data: result
  });
}));

// Bulk add top elite curators
router.post("/top-curators/bulk", asyncHandler(async (req: Request, res: Response) => {
  const { curators } = req.body;

  if (!Array.isArray(curators)) {
    return res.status(400).json({
      status: "error",
      message: "curators must be an array of objects with twitter_id and username"
    });
  }

  const results = [];
  const errors = [];

  for (const curator of curators) {
    try {
      const result = await eliteCuratorsService.addTopEliteCurator(
        curator.twitter_id,
        curator.username
      );
      results.push(result);
    } catch (error) {
      errors.push({
        curator,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  res.json({
    status: "success",
    message: `Added ${results.length} curators, ${errors.length} failed`,
    data: {
      added: results,
      errors: errors
    }
  });
}));

// Get elite curators by category
router.get("/curators/category/:category", asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

  // This would need to be implemented in the service
  // For now, we'll get all curators and filter by category
  const allCurators = await eliteCuratorsService.getEliteCurators();
  const filteredCurators = allCurators.filter(curator => {
    if (curator.categories && Array.isArray(curator.categories)) {
      return curator.categories.some((cat: any) => 
        cat.name.toLowerCase().includes(category.toLowerCase())
      );
    }
    return false;
  }).slice(0, limit);

  res.json({
    status: "success",
    count: filteredCurators.length,
    data: filteredCurators
  });
}));

// Proxy endpoint to fetch elite followers from twitterscore.io for a given twitter_id
router.get("/elite-followers/:twitter_id", asyncHandler(async (req: Request, res: Response) => {
  const { twitter_id } = req.params;
  if (!twitter_id) {
    return res.status(400).json({ error: "twitter_id is required" });
  }
  try {
    const apiKey = process.env.TWITTERSCORE_API_KEY;
    const url = `https://twitterscore.io/api/v1/get_followers`;
    const response = await axios.get(url, {
      params: {
        api_key: apiKey,
        twitter_id,
        page: 1,
        size: 1
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json, text/plain, */*',
      }
    });
    const data: any = response.data;
    if (data && data.success && typeof data.total === 'number') {
      return res.json({ eliteFollowers: data.total });
    } else {
      return res.status(404).json({ error: 'No data from twitterscore', response: data });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch from twitterscore' });
  }
}));

export default router; 