const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 处理静态文件
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.svg': 'application/image/svg+xml'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                res.end(); 
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 客户端连接
const clients = new Map();

// 游戏状态
const gameStates = new Map();

// 处理WebSocket连接
wss.on('connection', (ws) => {
    console.log('新的WebSocket连接');
    
    // 处理消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'connect':
                    // 新玩家连接
                    clients.set(data.playerId, ws);
                    ws.playerId = data.playerId;
                    console.log(`玩家${data.playerId} (${data.playerName}) 已连接`);
                    break;
                    
                case 'gameState':
                    // 更新游戏状态
                    gameStates.set(data.playerId, data.state);
                    // 广播游戏状态给对应玩家
                    if (clients.has(data.playerId)) {
                        clients.get(data.playerId).send(JSON.stringify({
                            type: 'gameState',
                            state: data.state
                        }));
                    }
                    break;
                    
                case 'direction':
                    // 方向控制
                    // 广播给主服务器
                    if (clients.has(0)) { // 玩家0是主服务器
                        clients.get(0).send(JSON.stringify({
                            type: 'direction',
                            playerId: data.playerId,
                            direction: data.direction
                        }));
                    }
                    break;
            }
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
        if (ws.playerId !== undefined) {
            console.log(`玩家${ws.playerId} 已断开连接`);
            clients.delete(ws.playerId);
        }
    });
    
    // 处理错误
    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket服务器运行在 ws://localhost:${PORT}`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});