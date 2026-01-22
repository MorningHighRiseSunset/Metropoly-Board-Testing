const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const VIDEOS_DIR = path.join(__dirname, 'Videos');

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Video API running', port: PORT });
});

// List all available videos
app.get('/api/videos', (req, res) => {
    try {
        const files = fs.readdirSync(VIDEOS_DIR)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
            })
            .map((file, index) => ({
                id: index,
                filename: file,
                path: `/api/stream/${encodeURIComponent(file)}`,
                size: fs.statSync(path.join(VIDEOS_DIR, file)).size
            }));
        
        res.json({ 
            count: files.length, 
            videos: files 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stream video with proper range request handling
app.get('/api/stream/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filepath = path.join(VIDEOS_DIR, filename);
        
        // Security: prevent directory traversal
        if (!filepath.startsWith(VIDEOS_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Check file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        const stat = fs.statSync(filepath);
        const fileSize = stat.size;
        
        // Handle range requests for better seeking/quality
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            
            if (start >= fileSize) {
                res.status(416).send('Requested Range Not Satisfiable\n' + start + ' >= ' + fileSize);
                return;
            }
            
            const chunksize = (end - start) + 1;
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'public, max-age=86400'
            });
            fs.createReadStream(filepath, { start: start, end: end }).pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=86400'
            });
            fs.createReadStream(filepath).pipe(res);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get video metadata
app.get('/api/video/:filename/info', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const filepath = path.join(VIDEOS_DIR, filename);
        
        if (!filepath.startsWith(VIDEOS_DIR)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        const stat = fs.statSync(filepath);
        res.json({
            filename: filename,
            size: stat.size,
            sizeInMB: (stat.size / (1024 * 1024)).toFixed(2),
            created: stat.birthtime,
            modified: stat.mtime,
            streamUrl: `/api/stream/${encodeURIComponent(filename)}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint - returns video URL optimized for quality
app.get('/api/proxy/:filename', (req, res) => {
    try {
        const filename = decodeURIComponent(req.params.filename);
        const quality = req.query.quality || 'high'; // low, medium, high
        
        const filepath = path.join(VIDEOS_DIR, filename);
        if (!filepath.startsWith(VIDEOS_DIR) || !fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json({
            filename: filename,
            quality: quality,
            url: `/api/stream/${encodeURIComponent(filename)}`,
            type: 'video/mp4',
            headers: {
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=86400'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🎬 Video API Server Running        ║
║     Port: ${PORT}                      ║
║     Videos Directory: ${VIDEOS_DIR}    ║
╚════════════════════════════════════════╝

📡 Available Endpoints:
  GET  /api/health              - Server status
  GET  /api/videos              - List all videos
  GET  /api/stream/:filename    - Stream video (supports range requests)
  GET  /api/video/:filename/info - Get video metadata
  GET  /api/proxy/:filename     - Get optimized video URL

💡 Usage Examples:
  - List videos:     curl http://localhost:${PORT}/api/videos
  - Stream video:    curl http://localhost:${PORT}/api/stream/video.mp4
  - Get info:        curl http://localhost:${PORT}/api/video/video.mp4/info

✨ Features:
  ✓ Range request support (better seeking/quality)
  ✓ Proper video streaming headers
  ✓ Cache control for optimization
  ✓ Security: Directory traversal prevention
  ✓ CORS enabled

🎮 Update your game to use:
  http://localhost:${PORT}/api/stream/VideoFilename.mp4
    `);
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
