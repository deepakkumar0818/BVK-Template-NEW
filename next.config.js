const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack otherwise picks the first lockfile up the tree (e.g. C:\Users\HP\package-lock.json),
  // which makes BVVK/app "outside" the root and breaks resolving `next`.
  turbopack: {
    root: path.join(__dirname),
  },
}

module.exports = nextConfig
