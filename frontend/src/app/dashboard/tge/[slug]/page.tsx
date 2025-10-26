import React from "react";
import TgeSlugPageClient from "./client";

export const dynamic = 'force-dynamic';

interface PlatformImages {
  projects: Record<string, string>;
  backers: Record<string, string>;
  platforms: Record<string, string>;
}

// Generate static params for all project slugs
export async function generateStaticParams() {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  const apiKey = process.env.TGE_API_KEY;
  
  try {
    const response = await fetch(`${helperApiUrl}/v1/projects`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      cache: 'force-cache' // Cache for static generation
    });

    if (!response.ok) {
      throw new Error(`Projects API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Projects API returned error');
    }

    const projects = data.data || [];
    
    // Generate slugs from project names (convert to lowercase and replace spaces with hyphens)
    return projects.map((project: any) => ({
      slug: project.name.toLowerCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Fetch platform images at build time (cached)
async function fetchPlatformImages(): Promise<PlatformImages> {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  
  try {
    const response = await fetch(`${helperApiUrl}/v1/platform-images`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Images API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Images API returned error');
    }

    return {
      projects: {},
      backers: {},
      platforms: data.data || {}
    };
  } catch (error) {
    console.error('Error fetching platform images:', error);
    return {
      projects: {},
      backers: {},
      platforms: {}
    };
  }
}

// Fetch projects data (same as dashboard)
async function fetchProjects() {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  const apiKey = process.env.TGE_API_KEY;
  
  try {
    const response = await fetch(`${helperApiUrl}/v1/projects`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      cache: 'no-store'
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

// Fetch metadata for a specific slug (optional)
async function fetchMetadata(slug: string) {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  
  try {
    const response = await fetch(`${helperApiUrl}/cryptorank/project/${slug}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.error || !data.success) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching metadata for ${slug}:`, error);
    return null;
  }
}

// Fetch team data for a specific slug
async function fetchTeamData(slug: string) {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers.onrender.com';
  
  try {
    const response = await fetch(`${helperApiUrl}/cryptorank/project/team/${slug}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.error || !data.success) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Error fetching team data for ${slug}:`, error);
    return null;
  }
}

// Main Page Component (Server Component - runs on server)
export default async function TgeSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch projects data and platform images
  const [projectsResult, platformImagesResult] = await Promise.all([
    fetchProjects(),
    fetchPlatformImages()
  ]);

  // Find the project by slug
  const projectName = slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  const projectData = projectsResult.data.find((pr: any) => 
    pr.name.toLowerCase().replace(/\s+/g, '-') === slug
  );

  // Fetch metadata and team data if available (optional)
  const [metadata, teamData] = await Promise.all([
    fetchMetadata(slug),
    fetchTeamData(slug)
  ]);

  // Normalize project data to match client shape
  const normalizedProject = projectData
    ? {
        name: projectData.name,
        backers: projectData.backers || [],
        infoPlatforms: projectData.platforms || [],
        amountRaised: projectData.amountRaised
          ? `$${Number(projectData.amountRaised).toLocaleString()}`
          : "",
        reward: projectData.rewards || "",
        type: projectData.type || "Campaign",
        status:
          projectData.status?.toLowerCase() === "ended" ? "ended" : "active",
        image: projectData.image || ""
      }
    : null;

  // Always render the page, even if project not found
  return (
    <TgeSlugPageClient 
      projectData={normalizedProject}
      metadata={metadata}
      teamData={teamData}
      platformImages={platformImagesResult}
      slug={slug}
    />
  );
}
