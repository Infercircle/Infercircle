import MediumCard from "@/components/MediumCard";
import TwitterFeedsCard from "@/components/TwitterFeedCard";
import Header from "@/components/Navbar";


export default function Home() {
  return (
    <>
   
      <Header />
      <TwitterFeedsCard />
      <MediumCard />
    </> 
  );
}
