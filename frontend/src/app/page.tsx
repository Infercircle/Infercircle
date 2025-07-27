import Navbar from "@/components/Navbar";


export default function Home() {
  return (
    <>
      <Navbar showAuthButtons={true} showConnectWallet={false} showSearch={false} />
    </> 
  );
}
