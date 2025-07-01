import MarketStatsBar from "@/components/assets/MarketStatsBar";
import AssetsCards from "@/components/assets/AssetCards";
import AssetTable from "@/components/assets/AssetTable";

export default function AssetsPage() {
  return (
    <div>
      <MarketStatsBar />
      <AssetsCards />
      <AssetTable />
      {/* Other assets dashboard content can go here */}
    </div>
  );
} 