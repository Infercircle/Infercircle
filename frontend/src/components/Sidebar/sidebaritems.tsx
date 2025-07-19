import {
  FiGlobe, FiBookmark, FiBarChart2,
  FiTrendingUp, FiUsers, FiVolume2, FiBox,
  FiDatabase, FiSmile, FiLayers
} from "react-icons/fi";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { GrRobot } from "react-icons/gr";
import { FaRegUserCircle } from "react-icons/fa";

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
      { label: "Watchlist", icon: FiBookmark, href: "/dashboard/watchlist" },
      { label: "Token Index", icon: FiBarChart2, href: "/dashboard/token-index" },
      { label: "Signal Index", icon: FiTrendingUp, href: "/dashboard/signal-index" },
      { label: "CT Nerds", icon: FiUsers, href: "/dashboard/ct-nerds" },
      { label: "Audio Catalogue", icon: FiVolume2, href: "/dashboard/audio-catalogue" },
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
