import { DefaultComponent } from "./DefaulComponent";
import PriceChart from "./PriceChart";
import { DataAnalysis } from "./DataAnalysis";

export const COMPONENT_REGISTRY = {
  PriceChart,
  DefaultComponent,
  DataAnalysis,
} as const;

export type ComponentName = keyof typeof COMPONENT_REGISTRY;