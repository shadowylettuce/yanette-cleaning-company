// next.config.mjs — Next.js configuration file
// We don't need any special settings yet, so this exports an empty config object.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // there is a stray package-lock.json in the user's home folder that confuses Next.js
  // about where the project starts — this line says "THIS folder is the project root"
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig // hand the config to Next.js
