export interface token {
    id: string;
    name: string;
    description: string;
    symbol: string;
    logo: string;
    tokenAddress: string;
    chain: {
        name: string;
        id: string;
        symbol: string;
    }
    explorer?: string;
    twitter?: string;
}