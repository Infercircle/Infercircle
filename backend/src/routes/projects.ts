import { Router, Request, Response } from "express";
import { asyncHandler } from "../lib/helper";
import fetch from "node-fetch";

const router = Router();

// Interface for project data
interface Project {
  name: string;
  symbol: string;
  icon: string;
  key: string;
  rank: number;
  category?: string;
}

// Fetch all projects from CryptoRank API across all categories
async function fetchAllProjects(): Promise<Project[]> {
  try {
    const response = await fetch('https://api.cryptorank.io/v0/search?query=bitcoin', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CryptoRank API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Combine all categories into one array
    const allProjects: Project[] = [];
    
    // Add coins
    if (data.coins) {
      allProjects.push(...data.coins.map((coin: any) => ({ ...coin, category: 'coin' })));
    }
    
    // Add funds
    if (data.funds) {
      allProjects.push(...data.funds.map((fund: any) => ({ ...fund, category: 'fund' })));
    }
    
    // Add funding
    if (data.funding) {
      allProjects.push(...data.funding.map((funding: any) => ({ ...funding, category: 'funding' })));
    }
    
    // Add activities
    if (data.activities) {
      allProjects.push(...data.activities.map((activity: any) => ({ ...activity, category: 'activity' })));
    }
    
    // Add fundraising
    if (data.fundraising) {
      allProjects.push(...data.fundraising.map((fundraising: any) => ({ ...fundraising, category: 'fundraising' })));
    }
    
    // Add exchanges
    if (data.exchanges) {
      allProjects.push(...data.exchanges.map((exchange: any) => ({ ...exchange, category: 'exchange' })));
    }
    
    // Add IDO platforms
    if (data.idoPlatforms) {
      allProjects.push(...data.idoPlatforms.map((ido: any) => ({ ...ido, category: 'ido' })));
    }
    
    // Add tags
    if (data.tags) {
      allProjects.push(...data.tags.map((tag: any) => ({ ...tag, category: 'tag' })));
    }
    
    // Add categories
    if (data.categories) {
      allProjects.push(...data.categories.map((category: any) => ({ ...category, category: 'category' })));
    }
    
    console.log(`Fetched ${allProjects.length} total projects from all categories`);
    return allProjects;
  } catch (error) {
    console.error('Error fetching projects from CryptoRank:', error);
    throw error;
  }
}

// Health check
router.get("/", (req: Request, res: Response) => {
  res.send("Projects API Server 🚀");
});

// GET /projects/all - Returns all projects for frontend caching
router.get("/all", asyncHandler(async (req: Request, res: Response) => {
  try {
    const allProjects = await fetchAllProjects();
    
    const formattedProjects = allProjects.map(project => ({
      id: project.symbol || project.name.toLowerCase().replace(/\s+/g, '-'),
      name: project.name,
      symbol: project.symbol || null,
      icon: project.icon,
      key: project.key,
      category: project.category
    }));

    res.status(200).json({
      status: "success",
      count: formattedProjects.length,
      data: formattedProjects
    });

  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch projects",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));


export default router;