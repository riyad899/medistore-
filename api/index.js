const path = require('path');

// Ensure dist is built
const distPath = path.join(__dirname, '../dist/index.js');

try {
    const app = require(distPath).default;
    module.exports = app;
} catch (error) {
    console.error('Failed to load app from dist:', error);
    
    // Fallback: return error response
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'Failed to initialize application',
            details: error.message
        });
    };
}
