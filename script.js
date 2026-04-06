// 游戏常量
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 300;
const GRID_SIZE = 20;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SIZE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SIZE;
const INITIAL_SNAKE_LENGTH = 3;
const INITIAL_TIME = 60;
const FOOD_SCORE = 10;
const TIME_BONUS = 5;
const SPEED_SETTINGS = {
    baby: 600,     // 婴儿 - 极极低速
    ultra_slow: 450, // 小小小朋友 - 极低速
    super_slow: 350, // 小小朋友 - 超低速
    slow: 250,    // 小朋友 - 低速
    medium: 150,  // 大朋友 - 中速
    fast: 80      // 高手 - 高速
};
const LEVEL_FOOD_COUNT = 5; // 每关需要吃的食物数量
const SPEED_INCREASE_PER_LEVEL = 5; // 每关速度增加的毫秒数

// 玩家控制键位
const PLAYER_CONTROLS = [
    { up: 'w', down: 's', left: 'a', right: 'd' },   // 玩家1: WASD
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, // 玩家2: 方向键
    { up: 'i', down: 'k', left: 'j', right: 'l' },   // 玩家3: IJKL
    { up: 't', down: 'g', left: 'f', right: 'h' }    // 玩家4: TFGH
];

// 游戏实例数组
let games = [];
// 玩家账号
let playerAccounts = ['玩家1', '玩家2'];

// 初始化游戏
function initGames() {
    // 清除旧的游戏实例
    games = [];
    
    // 获取玩家账号
    playerAccounts[0] = document.getElementById('player1').value || '玩家1';
    playerAccounts[1] = document.getElementById('player2').value || '玩家2';
    
    // 更新玩家名称显示
    document.getElementById('player1Name').textContent = playerAccounts[0];
    document.getElementById('player2Name').textContent = playerAccounts[1];
    
    // 创建2个游戏实例
    for (let i = 0; i < 2; i++) {
        const canvas = document.getElementsByClassName('gameCanvas')[i];
        const ctx = canvas.getContext('2d');
        const speedSelect = document.getElementsByClassName('speedSelect')[i];
        
        // 初始化蛇
        const snake = [];
        for (let j = INITIAL_SNAKE_LENGTH - 1; j >= 0; j--) {
            snake.push({
                x: j,
                y: Math.floor(GRID_HEIGHT / 2)
            });
        }
        
        // 生成初始食物
        const food = generateFood(snake);
        
        // 创建游戏实例
        const game = {
            canvas: canvas,
            ctx: ctx,
            snake: snake,
            food: food,
            direction: 'right',
            nextDirection: 'right',
            score: 0,
            time: INITIAL_TIME,
            level: 1,
            foodEaten: 0,
            gameInterval: null,
            timeInterval: null,
            isRunning: false,
            isPaused: false,
            speed: speedSelect.value,
            currentSpeedMs: SPEED_SETTINGS[speedSelect.value],
            playerIndex: i,
            playerName: playerAccounts[i],
            gameTime: 0 // 游戏时间（秒）
        };
        
        games.push(game);
        
        // 重置UI
        updateGameUI(game);
        drawGame(game);
    }
    
    // 更新排行榜
    updateLeaderboard();
}

// 生成食物
function generateFood(snake) {
    let emptyCells = [];
    
    // 找出所有空单元格
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            let isEmpty = true;
            for (let segment of snake) {
                if (segment.x === x && segment.y === y) {
                    isEmpty = false;
                    break;
                }
            }
            if (isEmpty) {
                emptyCells.push({x, y});
            }
        }
    }
    
    // 随机选择一个空单元格放置食物
    if (emptyCells.length > 0) {
        let randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }
    
    return {x: 0, y: 0};
}

// 绘制游戏
function drawGame(game) {
    // 清空画布
    game.ctx.fillStyle = '#111';
    game.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // 绘制网格（赛博朋克风格）
    game.ctx.strokeStyle = 'rgba(0, 255, 234, 0.1)';
    game.ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
        game.ctx.beginPath();
        game.ctx.moveTo(x, 0);
        game.ctx.lineTo(x, CANVAS_HEIGHT);
        game.ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
        game.ctx.beginPath();
        game.ctx.moveTo(0, y);
        game.ctx.lineTo(CANVAS_WIDTH, y);
        game.ctx.stroke();
    }
    
    // 绘制蛇
    for (let i = 0; i < game.snake.length; i++) {
        let segment = game.snake[i];
        
        // 蛇头特殊处理
        if (i === 0) {
            game.ctx.fillStyle = '#00ffea';
            game.ctx.shadowColor = '#00ffea';
            game.ctx.shadowBlur = 10;
        } else {
            game.ctx.fillStyle = '#00998a';
            game.ctx.shadowColor = '#00998a';
            game.ctx.shadowBlur = 5;
        }
        
        game.ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
        game.ctx.shadowBlur = 0; // 重置阴影
    }
    
    // 绘制食物（赛博朋克风格）
    game.ctx.fillStyle = '#ff00ea';
    game.ctx.shadowColor = '#ff00ea';
    game.ctx.shadowBlur = 15;
    game.ctx.beginPath();
    game.ctx.arc(
        game.food.x * GRID_SIZE + GRID_SIZE / 2,
        game.food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    game.ctx.fill();
    game.ctx.shadowBlur = 0; // 重置阴影
}

// 更新游戏
function updateGame(game) {
    if (!game.isRunning || game.isPaused) return;
    
    // 更新游戏时间
    game.gameTime += game.currentSpeedMs / 1000;
    
    // 更新方向
    game.direction = game.nextDirection;
    
    // 计算新蛇头位置
    let head = {...game.snake[0]};
    switch (game.direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }
    
    // 碰撞检测
    // 撞墙
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        gameOver(game);
        return;
    }
    
    // 撞自身
    for (let i = 1; i < game.snake.length; i++) {
        if (head.x === game.snake[i].x && head.y === game.snake[i].y) {
            gameOver(game);
            return;
        }
    }
    
    // 吃食物
    if (head.x === game.food.x && head.y === game.food.y) {
        // 增加分数
        game.score += FOOD_SCORE;
        
        // 增加时间奖励
        game.time += TIME_BONUS;
        
        // 增加食物计数
        game.foodEaten++;
        
        // 检查是否升级关卡
        if (game.foodEaten >= LEVEL_FOOD_COUNT) {
            // 升级关卡
            game.level++;
            
            // 增加速度（减少间隔时间）
            game.currentSpeedMs = Math.max(30, game.currentSpeedMs - SPEED_INCREASE_PER_LEVEL);
            
            // 从第二关开始，时间随着通关的级别而增加
            if (game.level >= 2) {
                const timeBonus = game.level * 5; // 每级增加5秒
                game.time += timeBonus;
            }
            
            // 重置食物计数
            game.foodEaten = 0;
            
            // 更新游戏循环速度
            clearInterval(game.gameInterval);
            game.gameInterval = setInterval(() => updateGame(game), game.currentSpeedMs);
            
            // 从第2关开始，每通一关就会释放胜利的音乐
            if (game.level >= 2) {
                const victoryMusic = document.getElementById('victoryMusic');
                victoryMusic.currentTime = 0; // 重置音乐
                victoryMusic.play();
                
                // 5秒后停止音乐
                setTimeout(() => {
                    victoryMusic.pause();
                    victoryMusic.currentTime = 0;
                }, 5000);
            }
            
            // 显示关卡升级信息
            game.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            game.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            game.ctx.fillStyle = '#00ffea';
            game.ctx.font = '20px Arial';
            game.ctx.textAlign = 'center';
            game.ctx.fillText('关卡升级！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
            game.ctx.font = '16px Arial';
            game.ctx.fillText(`当前关卡: ${game.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
            game.ctx.fillText('游戏将继续...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
            
            // 暂停一下，让玩家看到升级信息
            setTimeout(() => {
                drawGame(game);
            }, 1000);
        }
        
        // 生成新食物
        game.food = generateFood(game.snake);
        
        // 蛇长度增加（不删除尾部）
    } else {
        // 移动蛇（删除尾部）
        game.snake.pop();
    }
    
    // 添加新蛇头
    game.snake.unshift(head);
    
    // 更新UI
    updateGameUI(game);
    
    // 绘制游戏
    drawGame(game);
    
    // 发送游戏状态到服务器
    sendGameState(game);
    
    // 更新排行榜
    updateLeaderboard();
}

// 更新游戏UI
function updateGameUI(game) {
    const gameAreas = document.getElementsByClassName('game-area');
    const gameArea = gameAreas[game.playerIndex];
    
    const levelSpan = gameArea.querySelector('.level-span');
    const scoreSpan = gameArea.querySelector('.score-span');
    const timerSpan = gameArea.querySelector('.timer-span');
    
    if (levelSpan) levelSpan.textContent = game.level;
    if (scoreSpan) scoreSpan.textContent = game.score;
    if (timerSpan) timerSpan.textContent = game.time;
}

// 开始游戏
function startGame(game) {
    if (game.isRunning) return;
    
    // 获取当前选择的速度
    const speedSelects = document.getElementsByClassName('speedSelect');
    const speedSelect = speedSelects[game.playerIndex];
    game.speed = speedSelect.value;
    game.currentSpeedMs = SPEED_SETTINGS[game.speed];
    
    game.isRunning = true;
    game.isPaused = false;
    
    // 游戏主循环，根据选择的速度设置间隔时间
    game.gameInterval = setInterval(() => updateGame(game), game.currentSpeedMs);
    
    // 倒计时
    game.timeInterval = setInterval(() => {
        if (!game.isPaused) {
            game.time--;
            updateGameUI(game);
            
            if (game.time <= 0) {
                gameOver(game);
            }
        }
    }, 1000);
}

// 暂停游戏
function pauseGame(game) {
    if (!game.isRunning) return;
    
    game.isPaused = !game.isPaused;
}

// 重置游戏
function resetGame(game) {
    clearInterval(game.gameInterval);
    clearInterval(game.timeInterval);
    
    // 初始化蛇
    game.snake = [];
    for (let i = INITIAL_SNAKE_LENGTH - 1; i >= 0; i--) {
        game.snake.push({
            x: i,
            y: Math.floor(GRID_HEIGHT / 2)
        });
    }
    
    // 生成初始食物
    game.food = generateFood(game.snake);
    
    // 重置游戏状态
    game.direction = 'right';
    game.nextDirection = 'right';
    game.score = 0;
    game.time = INITIAL_TIME;
    game.level = 1;
    game.foodEaten = 0;
    game.isRunning = false;
    game.isPaused = false;
    
    // 获取当前选择的速度
    const speedSelects = document.getElementsByClassName('speedSelect');
    const speedSelect = speedSelects[game.playerIndex];
    game.speed = speedSelect.value;
    game.currentSpeedMs = SPEED_SETTINGS[game.speed];
    
    // 更新UI
    updateGameUI(game);
    drawGame(game);
    
    // 更新排行榜
    updateLeaderboard();
}

// 游戏结束
function gameOver(game) {
    clearInterval(game.gameInterval);
    clearInterval(game.timeInterval);
    game.isRunning = false;
    
    // 显示游戏结束信息
    game.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    game.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    game.ctx.fillStyle = '#00ffea';
    game.ctx.font = '20px Arial';
    game.ctx.textAlign = 'center';
    game.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    game.ctx.font = '16px Arial';
    game.ctx.fillText(`最终分数: ${game.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
    game.ctx.fillText('等待重新开始...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    // 更新排行榜
    updateLeaderboard();
}

// 更新排行榜
function updateLeaderboard() {
    // 收集所有玩家的分数
    const playerScores = games.map(game => ({
        name: game.playerName,
        score: game.score
    }));
    
    // 按分数排序
    playerScores.sort((a, b) => b.score - a.score);
    
    // 更新排行榜显示
    const leaderboardItems = document.getElementsByClassName('leaderboard-item');
    
    for (let i = 0; i < leaderboardItems.length && i < playerScores.length; i++) {
        const item = leaderboardItems[i];
        const playerSpan = item.querySelector('.player');
        const scoreSpan = item.querySelector('.score');
        
        if (playerSpan && scoreSpan) {
            playerSpan.textContent = playerScores[i].name;
            scoreSpan.textContent = playerScores[i].score;
        }
    }
}

// 开始所有游戏
function startAllGames() {
    games.forEach(game => startGame(game));
}

// 暂停所有游戏
function pauseAllGames() {
    games.forEach(game => pauseGame(game));
}

// 重置所有游戏
function resetAllGames() {
    initGames();
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    // 遍历所有游戏实例
    games.forEach((game, index) => {
        if (!game.isRunning) return;
        
        const controls = PLAYER_CONTROLS[index];
        
        switch (e.key) {
            case controls.up:
                if (game.direction !== 'down') {
                    game.nextDirection = 'up';
                }
                break;
            case controls.down:
                if (game.direction !== 'up') {
                    game.nextDirection = 'down';
                }
                break;
            case controls.left:
                if (game.direction !== 'right') {
                    game.nextDirection = 'left';
                }
                break;
            case controls.right:
                if (game.direction !== 'left') {
                    game.nextDirection = 'right';
                }
                break;
        }
    });
});

// 按钮事件监听
document.getElementById('startAllBtn').addEventListener('click', startAllGames);
document.getElementById('pauseAllBtn').addEventListener('click', pauseAllGames);
document.getElementById('resetAllBtn').addEventListener('click', resetAllGames);

// 玩家账号输入事件监听
document.getElementById('player1').addEventListener('input', initGames);
document.getElementById('player2').addEventListener('input', initGames);

// 速度选择事件监听
const speedSelects = document.getElementsByClassName('speedSelect');
for (let i = 0; i < speedSelects.length; i++) {
    speedSelects[i].addEventListener('change', initGames);
}

// WebSocket客户端
let wsClient;

// 初始化WebSocket客户端
function initWebSocket() {
    if (serverRunning) {
        wsClient = new WebSocket(wsServerUrl);
        
        wsClient.onopen = function() {
            console.log('WebSocket连接已建立');
            document.getElementById('serverStatus').textContent = '服务器已连接';
            document.getElementById('serverStatus').style.color = '#00ffea';
            
            // 发送连接信息
            wsClient.send(JSON.stringify({
                type: 'connect',
                playerId: 0, // 主服务器
                playerName: '主服务器'
            }));
            
            // 重新生成二维码
            for (let i = 1; i < 4; i++) {
                generateQRCode(i, playerAccounts[i]);
            }
        };
        
        wsClient.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'direction') {
                // 处理方向控制
                const game = games[data.playerId];
                if (game && game.isRunning) {
                    // 根据方向更新
                    switch (data.direction) {
                        case 'up':
                            if (game.direction !== 'down') {
                                game.nextDirection = 'up';
                            }
                            break;
                        case 'down':
                            if (game.direction !== 'up') {
                                game.nextDirection = 'down';
                            }
                            break;
                        case 'left':
                            if (game.direction !== 'right') {
                                game.nextDirection = 'left';
                            }
                            break;
                        case 'right':
                            if (game.direction !== 'left') {
                                game.nextDirection = 'right';
                            }
                            break;
                    }
                }
            }
        };
        
        wsClient.onclose = function() {
            console.log('WebSocket连接已关闭');
            document.getElementById('serverStatus').textContent = '服务器已断开';
            document.getElementById('serverStatus').style.color = '#ff00ea';
        };
        
        wsClient.onerror = function(error) {
            console.error('WebSocket错误:', error);
            document.getElementById('serverStatus').textContent = '连接错误';
            document.getElementById('serverStatus').style.color = '#ff00ea';
        };
    }
}

// 发送游戏状态到服务器
function sendGameState(game) {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
            type: 'gameState',
            playerId: game.playerIndex,
            state: {
                snake: game.snake,
                food: game.food,
                score: game.score,
                time: game.time,
                level: game.level
            }
        }));
    }
}

// 计算结果
function calculateResult() {
    // 收集所有玩家的游戏数据
    const playerResults = games.map(game => ({
        name: game.playerName,
        score: game.score,
        level: game.level,
        gameTime: game.gameTime,
        efficiency: game.gameTime > 0 ? game.score / game.gameTime : 0 // 分数/时间 效率
    }));
    
    // 按效率排序（分数/时间）
    playerResults.sort((a, b) => b.efficiency - a.efficiency);
    
    // 显示结果
    const resultContent = document.getElementById('resultContent');
    let resultHTML = '<h4>比赛结果</h4>';
    
    if (playerResults.length > 0) {
        resultHTML += `<p class="winner">冠军: ${playerResults[0].name}</p>`;
        resultHTML += `<p>分数: ${playerResults[0].score}</p>`;
        resultHTML += `<p>关卡: ${playerResults[0].level}</p>`;
        resultHTML += `<p>游戏时间: ${playerResults[0].gameTime}秒</p>`;
        resultHTML += `<p>效率: ${playerResults[0].efficiency.toFixed(2)} 分/秒</p>`;
        
        if (playerResults.length > 1) {
            resultHTML += '<hr>';
            resultHTML += `<p>亚军: ${playerResults[1].name}</p>`;
            resultHTML += `<p>分数: ${playerResults[1].score}</p>`;
        }
        
        if (playerResults.length > 2) {
            resultHTML += '<hr>';
            resultHTML += `<p>季军: ${playerResults[2].name}</p>`;
            resultHTML += `<p>分数: ${playerResults[2].score}</p>`;
        }
    } else {
        resultHTML += '<p>暂无比赛数据</p>';
    }
    
    resultContent.innerHTML = resultHTML;
}

// 按钮事件监听
document.getElementById('calculateResultBtn').addEventListener('click', calculateResult);

// 初始化游戏
initGames();