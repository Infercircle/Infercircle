"use client"
import React, { useEffect, useState } from "react";
import { Article } from "@/interfaces/medium";

interface RawArticle {
  id: string;
  title: string;
  url: string;
  author: string;
  publication_id: string;
  published_at: string;
  subtitle: string;
}

export default function MediumCard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch function
  const fetchArticles = () => {
    fetch(
      `http://localhost:8080/medium/search?q=blockchain,defi,web3,bitcoin,ethereum,crypto,&_=${Date.now()}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched at", new Date().toLocaleTimeString(), data.data);
        // Transform the data to match the expected structure
        const articles = (data.data || []).map((article: RawArticle) => ({
          id: article.id,
          title: article.title,
          url: article.url,
          author: {
            id: article.author,
            name: article.author, // You may want to fetch author details if needed
            profileUrl: `https://medium.com/@${article.author}`,
          },
          publication: {
            id: article.publication_id,
            name: article.publication_id,
            url: "", // Not available
          },
          date: article.published_at,
          content: article.subtitle, // Use subtitle as content if nothing else
          summary: article.subtitle,
        }));
        setArticles(articles);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Failed to load articles");
      });
  };

  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, 10000); // 10 seconds for testing

    return () => clearInterval(interval);
  }, []);

  if (loading)
    return <div className="text-center py-8">Loading Medium articles...</div>;

  return (
    <div className="max-w-2xl my-8 p-4 ">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">
        Latest Crypto Articles on Medium
      </h2>
      <div className="space-y-4">
        {articles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#181c20] rounded-lg shadow p-4 border border-[#23272b] hover:bg-[#23272b]/60 transition"
          >
            <div className="flex items-center mb-2">
              <span className="font-semibold text-base text-gray-100">
                {article.title}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-400 mb-1">
              {article.author && (
                <span>
                  By{" "}
                  <span className="font-bold text-cyan-400">
                    {article.author.name}
                  </span>
                </span>
              )}
              {article.publication && (
                <span className="ml-2">
                  in{" "}
                  <span className="font-bold text-cyan-400">
                    {article.publication.name}
                  </span>
                </span>
              )}
              <span className="ml-2">
                {new Date(article.date).toLocaleDateString()}
              </span>
            </div>
            {article.summary && (
              <div className="text-gray-300 text-sm mb-2">
                {article.summary}
              </div>
            )}
            {/* Optionally show a snippet of content */}
            {article.content && (
              <div
                className="text-gray-400 text-xs line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: article.content.slice(0, 300) + "...",
                }}
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
