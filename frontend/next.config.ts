// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      's2.coinmarketcap.com',
      'pbs.twimg.com',
      'abs.twimg.com', 
      'coin-images.coingecko.com',
      '*',
    ],
  },
};

module.exports = nextConfig;
