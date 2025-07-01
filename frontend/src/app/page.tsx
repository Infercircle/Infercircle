import MediumCard from "@/components/MediumCard";
import TwitterFeedCard from "@/components/TwitterFeedCard";
import Navbar from "@/components/Navbar";


export default function Home() {
  return (
    <>
   
      <Navbar showAuthButtons={true} showConnectWallet={false} showSearch={false} />
      <TwitterFeedCard />
      <MediumCard />
    </> 
  );
}
