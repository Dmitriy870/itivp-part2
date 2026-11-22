const rawApiUrl = process.env.VITE_API_URL?.trim();
if (!rawApiUrl && process.env.VERCEL_ENV === 'production') {
  throw new Error('Set VITE_API_URL in the Vercel Production environment before deploying');
}
const apiUrl = rawApiUrl && new URL(rawApiUrl);
if (apiUrl && (
  apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password
  || apiUrl.search || apiUrl.hash || apiUrl.pathname !== '/'
)) {
  throw new Error('VITE_API_URL must be the HTTPS origin of the Express API');
}

export const config = {
  framework: 'vite',
  installCommand: 'npm ci',
  buildCommand: 'VITE_USE_API_PROXY=true npm run build',
  outputDirectory: 'dist',
  rewrites: [
    ...(apiUrl ? [{ source: '/api/:path*', destination: `${apiUrl.origin}/:path*` }] : []),
    { source: '/((?!api/|assets/).*)', destination: '/index.html' },
  ],
};
