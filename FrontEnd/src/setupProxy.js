const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://find-my-docs-backend-qwhkv8syl-dasuntharuka34s-projects.vercel.app',
      changeOrigin: true,
      secure: true,
      onProxyReq: (proxyReq, req, res) => {
        // Remove origin header to avoid CORS issues with some backends
        proxyReq.removeHeader('origin');
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
      }
    })
  );
};
