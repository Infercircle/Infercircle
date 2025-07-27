// @ts-expect-error: No type definitions for react-sparklines
import { Sparklines, SparklinesLine } from "react-sparklines";
import React from "react";

const MiniGraph: React.FC<{ data: number[] }> = ({ data }) => (
  <Sparklines data={data} width={80} height={24} margin={4}>
    <SparklinesLine color="green" style={{ fill: "none" }} />
  </Sparklines>
);

export default MiniGraph; 