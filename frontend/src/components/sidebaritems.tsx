import {
  FiGlobe, FiCpu, FiBookmark, FiBarChart2,
  FiTrendingUp, FiUsers, FiVolume2, FiBox,
  FiDatabase, FiSmile, FiLayers, FiGift
} from "react-icons/fi";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { GrRobot } from "react-icons/gr";
import { FaRegUserCircle } from "react-icons/fa";

const sidebarItems = [
  {
    label: "Overview",
    icon: BiSolidCategoryAlt,
    href: "/",
  },
  {
    
    group: "Social Metrics",
    icon: FiUsers,
    items: [
      { label: "Browser", icon: FiGlobe, href: "/browser" },
      { label: "InferAI", icon: GrRobot, href: "/inferai" },
      { label: "Watchlist", icon: FiBookmark, href: "/watchlist" },
      { label: "Token Index", icon: FiBarChart2, href: "/token-index" },
      { label: "Signal Index", icon: FiTrendingUp, href: "/signal-index" },
      { label: "CT Nerds", icon: FiUsers, href: "/ct-nerds" },
      { label: "Audio Catalogue", icon: FiVolume2, href: "/audio-catalogue" },
    ],
  },
  {
    group: "Onchain Metrics",
    icon: FiDatabase,
    items: [
      { label: "Pre TGE", icon: FiBox, href: "/pre-tge" },
      { label: "Assets", icon: FiDatabase, href: "/assets" },
      { label: "Projects Sentiments", icon: FiSmile, href: "/project-sentiment" },
      { label: "Active IDO Projects", icon: FiLayers, href: "/ido-projects" },
      { label: "Post TGE Projects", icon: FiLayers, href: "/post-tge-projects" },
    ],
  },
  {
    label: "Account",
    icon: FaRegUserCircle,
   href: "/account",
  },
];

export default sidebarItems;
