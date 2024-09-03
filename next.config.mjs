/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["gateway.ipfscdn.io"],
    unoptimized: true,
  },
  env: {
    DFX_NETWORK: process.env.DFX_NETWORK,
    CANISTER_ID_INTERNET_IDENTITY: process.env.CANISTER_ID_INTERNET_IDENTITY,
    CANISTER_ID: process.env.CANISTER_ID,
  },
  output: 'export',
};

export default nextConfig;
