import React from "react";
import TGEPageClient from "./client";

export const dynamic = 'force-dynamic';

type ProjectStatus = "active" | "ended";
type ProjectType = "Pre-TGE" | "Post-TGE" | "Community Build Opportunities" | "Campaign";

interface PlatformImages {
  projects: Record<string, string>;
  backers: Record<string, string>;
  platforms: Record<string, string>;
}

// 🔥 SSR: Fetch projects data on every request (secure API calls)
async function fetchProjects() {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  const apiKey = 'ak_pro_Jpo05NPhS_VEMIDrAOr-ayWHrsg5q3CO';
  
  try {
    const response = await fetch(`${helperApiUrl}/v1/projects`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      cache: 'no-store' // Force fresh data on each request (SSR equivalent)
    });

    if (!response.ok) {
      throw new Error(`Projects API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Projects API returned error');
    }

    return {
      data: data.data || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    };
  }
}

// 🔥 SSG: Fetch platform images at build time (cached)
async function fetchPlatformImages() {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  
  try {
    const response = await fetch(`${helperApiUrl}/v1/platform-images`, {
      next: { revalidate: 3600 } // Cache for 1 hour (SSG equivalent)
    });
    
    if (!response.ok) {
      throw new Error(`Images API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Images API returned error');
    }

    return {
      data: {
        projects: {},
        backers: {},
        platforms: data.data || {}
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching platform images:', error);
    return {
      data: {
        projects: {},
        backers: {},
        platforms: {}
      },
      error: error instanceof Error ? error.message : 'Failed to fetch platform images'
    };
  }
}

// 🔥 Main Page Component (Server Component - runs on server)
export default async function TGEPage() {
  // Parallel fetching for better performance
  const [projectsResult, imagesResult] = await Promise.all([
    fetchProjects(),
    fetchPlatformImages()
  ]);

  return (
    <TGEPageClient 
      projects={projectsResult.data}
      platformImages={imagesResult.data}
      apiError={projectsResult.error}
    />
  );
}
