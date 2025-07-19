import { DefaultComponent } from "./DefaulComponent";
import PriceChart from "./PriceChart";

export const COMPONENT_REGISTRY = {
  PriceChart,
  DefaultComponent,
} as const;

export type ComponentName = keyof typeof COMPONENT_REGISTRY;