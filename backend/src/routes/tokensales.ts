// Logic for CryptoRank IDO/ICO

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Types for the API response
interface TokenSale {
    id: number;
    slug: string;
    symbol: string;
    name: string;
    type: string;
    category: string;
    rank: number;
    price: number;
    initialMarketCap: number;
    totalSupply: number;
    circulatingSupply: number;
    fullyDilutedValuation: number;
    crowdsaleStatus: 'past' | 'active' | 'upcoming';
    isTraded: boolean;
    launchpadIds: number[];
    startDate: string;
    endDate: string;
}

interface TokenSalesResponse {
    data: TokenSale[];
    meta: {
        total: number;
        limit: number;
        skip: number;
    };
}

// Query parameters interface
interface TokenSalesQuery {
    crowdsaleStatus?: 'past' | 'active' | 'upcoming';
    isTraded?: boolean;
    launchpadIds?: number[];
    sortBy?: 'startDate' | 'endDate';
    sortDirection?: 'ASC' | 'DESC';
    limit?: number;
    skip?: number;
}

const API_KEY = '';
const BASE_URL = '';

// Get token sales with optional filters
router.get('/', async (req, res) => {
    try {
        const queryParams: TokenSalesQuery = {
            crowdsaleStatus: req.query.crowdsaleStatus as TokenSalesQuery['crowdsaleStatus'],
            isTraded: req.query.isTraded === 'true',
            launchpadIds: req.query.launchpadIds ? (req.query.launchpadIds as string).split(',').map(Number) : undefined,
            sortBy: req.query.sortBy as TokenSalesQuery['sortBy'],
            sortDirection: req.query.sortDirection as TokenSalesQuery['sortDirection'],
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            skip: req.query.skip ? Number(req.query.skip) : undefined,
        };

        console.log('Making request to:', BASE_URL);
        console.log('With params:', queryParams);

        const response = await axios.get<TokenSalesResponse>(BASE_URL, {
            headers: {
                'X-Api-Key': API_KEY,
                'Accept': 'application/json'
            },
            params: queryParams
        });

        res.json(response.data);
    } catch (error: any) {
        console.error('Error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        
        if (error.response) {
            res.status(error.response.status).json({
                error: 'API request failed',
                status: error.response.status,
                message: error.response.data
            });
        } else if (error.request) {
            res.status(500).json({
                error: 'No response received from API',
                message: error.message
            });
        } else {
            res.status(500).json({
                error: 'Request setup failed',
                message: error.message
            });
        }
    }
});

// Get specific token sale by ID
router.get('/:id', async (req, res) => {
    try {
        const response = await axios.get<TokenSale>(`${BASE_URL}/${req.params.id}`, {
            headers: {
                'X-Api-Key': API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching token sale:', error);
        res.status(500).json({ error: 'Failed to fetch token sale data' });
    }
});

export default router; 