/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // 一般使用者不需要看到左下角的開發標記
  devIndicators: false,
};

module.exports = nextConfig;
