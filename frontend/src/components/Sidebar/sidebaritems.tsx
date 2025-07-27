import {
  FiGlobe, FiBookmark, FiBarChart2,
  FiTrendingUp, FiUsers, FiBox,
  FiDatabase, FiSmile, FiLayers, FiStar
} from "react-icons/fi";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { GrRobot } from "react-icons/gr";
import { FaRegUserCircle } from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";

const sidebarItems = [
  {
    label: "Overview",
    icon: BiSolidCategoryAlt,
    href: "/dashboard",
  },
  {
    
    group: "Social Metrics",
    icon: FiUsers,
    items: [
      { label: "Browser", icon: FiGlobe, href: "/dashboard/browser" },
      { label: "InferAI", icon: GrRobot, href: "/dashboard/inferai" },
      { label: "Watchlist", icon: FiStar, href: "/dashboard/watchlist" },
      { label: "Token Index", icon: FiBarChart2, href: "/dashboard/token-index" },
      { label: "Signal Index", icon: FiTrendingUp, href: "/dashboard/signal-index" },
      { label: "CT Nerds", icon: FiUsers, href: "/dashboard/ct-nerds" },
      { label: "Spaces Summarizer", icon: FaSquareXTwitter, href: "/dashboard/spaces-summarizer" },
    ],
  },
  {
    group: "Onchain Metrics",
    icon: FiDatabase,
    items: [
      { label: "Assets", icon: FiDatabase, href: "/dashboard/assets" },
      { label: "Onchain Tracking", icon: FiSmile, href: "/dashboard/onchain-tracking" },
      { label: "Pre TGE", icon: FiBox, href: "/dashboard/pre-tge" },
      { label: "Active IDO Projects", icon: FiLayers, href: "/dashboard/ido-projects" },
      { label: "Post TGE Projects", icon: FiLayers, href: "/dashboard/post-tge-projects" },
    ],
  },
  {
    label: "Account",
    icon: FaRegUserCircle,
   href: "/dashboard/account",
  },
];

export default sidebarItems;
