"use client"
import React from "react";
import { FaSquareXTwitter } from "react-icons/fa6";
import { LuFullscreen } from "react-icons/lu";
import { useEffect, useState } from "react";
import axios from "axios";
import { Feed } from "@/interfaces/tweetcard";



export default function TwitterFeedsCard() {
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const isTruncated = !fullscreen;

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        const res = await axios.get<{ data: Feed[] }>(
          "http://localhost:5000/twitter/tweets"
        );
        setFeeds(res.data.data);
      } catch (error) {
        console.error("Error fetching tweets:", error);
      }
    };

    fetchTweets();
    const interval = setInterval(fetchTweets, 10000); // auto refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`bg-[#181c20] shadow-lg text-gray-200 font-inter border border-[#23272b] ${
        fullscreen
          ? "fixed inset-0 z-50 w-full h-full rounded-none"
          : "w-auto max-w-md m-4 rounded-lg"
      }`}
      style={fullscreen ? { maxHeight: "100vh" } : {}}
    >
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-[#23272b] font-semibold text-base tracking-wide bg-[#181c20]">
        <div
          className="rounded mr-3 flex items-center justify-center"
          style={{ width: 28, height: 28 }}
        >
          <FaSquareXTwitter className="text-white w-6 h-6" size={18} />
        </div>
        <span className="text-gray-100 flex-1">Twitter Feeds (CT)</span>
        <button
          className="ml-2 p-0 border-none outline-none focus:outline-none cursor-pointer"
          onClick={() => setFullscreen((f) => !f)}
          type="button"
        >
          <LuFullscreen className="text-gray-400" size={16} />
        </button>
      </div>

      {/* Feed List */}
      <div
        className={`max-h-[420px] ${
          fullscreen
            ? "max-h-full overflow-x-auto whitespace-nowrap"
            : "overflow-x-hidden"
        }`}
      >
        {feeds.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No tweets yet.</div>
        ) : (
          feeds.map((feed, idx) => (
            <a
              key={idx}
              href={feed.tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <div
                className={`${
                  fullscreen ? "inline-flex" : "flex"
                } items-start px-4 py-2 text-[14px] border-b border-[#23272b] last:border-b-0 hover:bg-[#23272b]/60 transition`}
              >
                <span
                  className="rounded font-bold text-[12px] px-2 py-0.5 min-w-[36px] text-center mr-1 text-blue-400 whitespace-nowrap"
                  style={{ letterSpacing: "0.5px" }}
                >
                  {feed.matchedRule || "N/A"}
                </span>
                <div className="flex-1 min-w-0 flex items-center">
                  <span
                    className={`font-bold text-gray-100 mr-1 whitespace-nowrap`}
                  >
                    {isTruncated && feed.name && feed.name.length > 10
                      ? feed.name.slice(0, 10) + "…"
                      : feed.name}
                  </span>
                  <span
                    className={`text-gray-400 block ${
                      isTruncated ? "truncate" : ""
                    }`}
                    style={isTruncated ? { minWidth: 0 } : {}}
                  >
                    {feed.text}
                  </span>
                </div>
                <span className="ml-1 text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                  {feed.timestamp}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
