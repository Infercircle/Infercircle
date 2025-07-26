export interface Tag {
  key: string;
  name: string;
}

export interface Category {
  key: string;
  name: string;
}

export interface TwitterData {
  twitterScore: number;
  followersCount: number | null;
  twitterAccountId: number;
  topFollowers: any[];
}

export interface TokenSaleProject {
  isSponsored: boolean;
  name: string;
  key: string;
  symbol: string;
  image: string;
  category: Category;
  initialCap: number | null;
  raise: number;
  till: string;
  when?: string;
  launchpads: any[];
  totalRaise: number;
  type: string[];
  funds: any[];
  tags: Tag[];
  salePrice: number;
  twitterData: TwitterData;
  blockchains: any[];
}

export interface FilterState {
  search: string;
  status: "upcoming" | "active" | "past";
  tokenSaleTypes: string[];
  launchpads: string[];
  categories: string[];
  ecosystems: string[];
  tokenSaleStartDates?: {
    start?: string;
    end?: string;
  };
}

export interface SortOption {
  field: "name" | "raise" | "totalRaise" | "till" | "when";
  order: "asc" | "desc";
}

export const TOKEN_SALE_TYPES = [
  "IDO",
  "ICO",
  "Pre-sale",
  "Private",
  "KOL",
  "Pre-Seed",
  "Seed",
  "Private 2",
  "Strategic",
  "Private/Pre-sale",
  "Node Sale"
];

export const LAUNCHPAD_OPTIONS = [
  "Fount",
  "Poolz Finance",
  "Spores Network",
  "BSCS",
  "Binance Wallet",
  "Seedify",
  "Coinlist",
  "AITECH PAD",
  "Eesee",
  "KingdomStarter",
  "FireStarter",
  "TrustPad",
  "RazrFi",
  "Koistarter",
  "TruePNL",
  "FinLaunch",
  "OpenPad",
  "WeWay",
  "ChainGPT Pad",
  "Decubate",
  "Agentlauncher",
  "LEGION",
  "Tokensoft",
  "BinStarter",
  "BullPerks",
  "BlastUP",
  "SeaFi",
  "De.Fi Accelerator",
  "Gamestarter",
  "PAID",
  "Red Kite",
  "SingularityDAO",
  "Enjinstarter",
  "ChainBoost",
  "Huostarter",
  "Kommunitas",
  "BrightStart",
  "Vent Finance",
  "Polkastarter",
  "OccamRazer",
  "Eclipse Fi",
  "TrustFi",
  "Unicorn Hunter",
  "IXIR",
  "ETHPad",
  "SidusPad",
  "TorkPad",
  "Solanium",
  "GameFi",
  "Launchpool",
  "DegenPad",
  "Ordify",
  "Dappad+",
  "Echo",
  "Coin Terminal"
];

export const CATEGORY_OPTIONS = [
  "Blockchain Service",
  "GameFi",
  "Social",
  "Chain",
  "NFT",
  "DeFi",
  "CeFi",
  "Blockchain Infrastructure",
  "Meme"
];

export const ECOSYSTEM_OPTIONS = [
  "Avalanche Ecosystem",
  "Base Ecosystem",
  "BNB Chain Ecosystem",
  "Polygon Ecosystem",
  "Solana Ecosystem",
  "Ethereum Ecosystem",
  "Arbitrum Ecosystem",
  "TON Ecosystem",
  "Optimism Ecosystem",
  "Scroll Ecosystem",
  "Core Ecosystem",
  "Boba Ecosystem",
  "Celo Ecosystem",
  "Metis Ecosystem",
  "Bitlayer Ecosystem",
  "Linea Ecosystem",
  "Mantle Ecosystem",
  "Sui Ecosystem",
  "Cosmos Ecosystem",
  "Mode Ecosystem",
  "Zircuit Ecosystem",
  "Camp Network Ecosystem",
  "Berachain Ecosystem",
  "Bsquared Ecosystem",
  "Ink Ecosystem",
  "Polygon zkEVM",
  "Blast Ecosystem",
  "Taiko Ecosystem",
  "BOB Ecosystem",
  "Soneium Ecosystem",
  "Unichain Ecosystem",
  "Immutable Ecosystem",
  "Hyperliquid Ecosystem",
  "Story Ecosystem",
  "zkSync Ecosystem",
  "Monad Ecosystem",
  "Abstract Ecosystem"
];