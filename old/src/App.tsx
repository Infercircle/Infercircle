import React from "react";
import TwitterFeedsCard from "./components/TwitterFeedsCard";
import Navbar from "./components/Header";
import MediumCard from "./components/MediumCard";

const App = () => {
  return (
    <>
      {/* Reusable Components*/}
      <Navbar />
      <TwitterFeedsCard />
      <MediumCard />
    </>
  );
};

export default App;