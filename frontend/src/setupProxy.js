const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Détection automatique de l'environnement
  let target = 'http://localhost:5000';
  
  // Si on est dans Codespaces, utiliser l'URL Codespaces
  if (process.env.CODESPACES === 'true' && process.env.CODESPACE_NAME) {
    target = `https://${process.env.CODESPACE_NAME}-5000.app.github.dev`;
    console.log('🌍 Proxy Codespaces configuré:', target);
  }
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log(`📤 Proxy: ${req.method} ${req.url} -> ${target}${req.url}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`📥 Proxy: ${proxyRes.statusCode} ${req.url}`);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
      }
    })
  );
};