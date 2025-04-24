// 游戏常量
const GRID_SIZE = 20; // 网格大小
const GAME_SPEED = 150; // 初始速度（毫秒）
const CANVAS_BORDER_COLOR = '#2196F3';
const CANVAS_BACKGROUND_COLOR = '#e3f2fd';
const SNAKE_COLOR = '#4CAF50';
const SNAKE_BORDER_COLOR = '#388E3C';
const SNAKE2_COLOR = '#9C27B0'; // 第二条蛇的颜色
const SNAKE2_BORDER_COLOR = '#7B1FA2'; // 第二条蛇边框颜色
const FOOD_COLOR = '#FF5722';
const FOOD_BORDER_COLOR = '#E64A19';

// 键位配置
let keyConfig = {
    player1: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    },
    player2: {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd'
    }
};

// 从localStorage加载键位配置
if (localStorage.getItem('keyConfig')) {
    keyConfig = JSON.parse(localStorage.getItem('keyConfig'));
}

// 游戏变量
let canvas, ctx;
let snake, snake2, food;
let score = 0;
let score2 = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameInterval;
let isPaused = false;
let gameOver = false;
let direction = 'right';
let direction2 = 'left';
let nextDirection = 'right';
let nextDirection2 = 'left';
let lastRenderTime = 0;
let isMultiplayer = false; // 是否为双人模式

// DOM元素
const gameCanvas = document.getElementById('gameCanvas');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const pauseButton = document.getElementById('pauseButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const startScreen = document.getElementById('startScreen');
const pauseIndicator = document.getElementById('pauseIndicator');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

// 创建模式切换按钮和自定义键位按钮
const modeToggleButton = document.createElement('button');
modeToggleButton.id = 'modeToggleButton';
modeToggleButton.textContent = '切换双人模式';
modeToggleButton.style.marginTop = '10px';

const keyConfigButton = document.createElement('button');
keyConfigButton.id = 'keyConfigButton';
keyConfigButton.textContent = '自定义键位';
keyConfigButton.style.marginTop = '10px';

// 创建游戏中重开按钮
const restartInGameButton = document.createElement('button');
restartInGameButton.id = 'restartInGameButton';
restartInGameButton.textContent = '重新开始';
restartInGameButton.style.marginTop = '10px';

// 创建第二个玩家分数显示
const score2Container = document.createElement('div');
score2Container.className = 'score2-container';
score2Container.innerHTML = '<span>玩家2分数：</span><span id="score2">0</span>';
score2Container.style.display = 'none';

const score2Element = document.createElement('span');
score2Element.id = 'score2';
score2Element.textContent = '0';

// 初始化游戏
function init() {
    canvas = gameCanvas;
    ctx = canvas.getContext('2d');
    
    // 校正Canvas的高度，保持正方形
    canvas.height = canvas.width;
    
    // 初始化分数显示
    highScoreElement.textContent = highScore;
    
    // 添加事件监听器
    document.addEventListener('keydown', changeDirection);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    pauseButton.addEventListener('click', togglePause);
    
    // 添加移动设备按钮事件
    upButton.addEventListener('click', () => changeDirectionButton('up'));
    downButton.addEventListener('click', () => changeDirectionButton('down'));
    leftButton.addEventListener('click', () => changeDirectionButton('left'));
    rightButton.addEventListener('click', () => changeDirectionButton('right'));
    
    // 添加模式切换按钮、自定义键位按钮和游戏中重开按钮
    const controlsDiv = document.querySelector('.controls');
    controlsDiv.parentNode.insertBefore(modeToggleButton, controlsDiv.nextSibling);
    controlsDiv.parentNode.insertBefore(keyConfigButton, modeToggleButton.nextSibling);
    controlsDiv.parentNode.insertBefore(restartInGameButton, keyConfigButton.nextSibling);
    
    // 添加第二个玩家分数显示
    const gameInfoDiv = document.querySelector('.game-info');
    gameInfoDiv.appendChild(score2Container);
    
    // 添加模式切换、键位配置和游戏中重开事件监听器
    modeToggleButton.addEventListener('click', toggleMultiplayerMode);
    keyConfigButton.addEventListener('click', openKeyConfig);
    restartInGameButton.addEventListener('click', restartGameInProgress);
    
    // 显示开始界面
    startScreen.classList.remove('hidden');
}

// 开始游戏
function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    resetGame();
    gameLoop();
}

// 重置游戏状态
function resetGame() {
    // 重置分数
    score = 0;
    score2 = 0;
    scoreElement.textContent = score;
    score2Element.textContent = score2;
    
    // 创建初始蛇身
    const centerX = Math.floor((canvas.width / GRID_SIZE) / 2);
    const centerY = Math.floor((canvas.height / GRID_SIZE) / 2);
    
    snake = [
        {x: centerX, y: centerY},
        {x: centerX - 1, y: centerY},
        {x: centerX - 2, y: centerY}
    ];
    
    // 创建第二条蛇（如果是双人模式）
    if (isMultiplayer) {
        snake2 = [
            {x: centerX, y: centerY + 5},
            {x: centerX + 1, y: centerY + 5},
            {x: centerX + 2, y: centerY + 5}
        ];
        direction2 = 'left';
        nextDirection2 = 'left';
        score2Container.style.display = 'block';
    } else {
        score2Container.style.display = 'none';
    }
    
    // 重置方向
    direction = 'right';
    nextDirection = 'right';
    
    // 创建第一个食物
    createFood();
    
    // 重置游戏状态
    gameOver = false;
    isPaused = false;
    pauseIndicator.classList.add('hidden');
    
    // 清除之前的定时器
    if (gameInterval) clearInterval(gameInterval);
}

// 游戏主循环
function gameLoop() {
    if (gameOver) return;
    
    // 添加玩家状态标记
    let player1Dead = false;
    let player2Dead = false;
    
    gameInterval = setInterval(() => {
        if (!isPaused) {
            clearCanvas();
            
            // 只有玩家1未死亡时才移动
            if (!player1Dead) {
                moveSnake();
            }
            
            // 只有玩家2未死亡且是双人模式时才移动
            if (isMultiplayer && !player2Dead) {
                moveSnake2();
            }
            
            drawFood();
            drawSnake();
            if (isMultiplayer) {
                drawSnake2();
            }
            
            // 检查碰撞并更新玩家状态
            const collisionResult = checkCollision();
            if (collisionResult) {
                player1Dead = collisionResult.player1Dead || player1Dead;
                player2Dead = collisionResult.player2Dead || player2Dead;
            }
        }
    }, GAME_SPEED);
}

// 清空画布
function clearCanvas() {
    ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
    ctx.strokeStyle = CANVAS_BORDER_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// 绘制蛇
function drawSnake() {
    snake.forEach(segment => drawSnakeSegment(segment, SNAKE_COLOR, SNAKE_BORDER_COLOR));
}

// 绘制第二条蛇
function drawSnake2() {
    snake2.forEach(segment => drawSnakeSegment(segment, SNAKE2_COLOR, SNAKE2_BORDER_COLOR));
}

// 绘制蛇的一个节段
function drawSnakeSegment(segment, fillColor, strokeColor) {
    const x = segment.x * GRID_SIZE;
    const y = segment.y * GRID_SIZE;
    
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
}

// 移动蛇
function moveSnake() {
    // 更新方向
    direction = nextDirection;
    
    // 创建新的头部位置
    const head = {x: snake[0].x, y: snake[0].y};
    
    // 根据当前方向改变头部位置
    switch(direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 处理边界穿越
    const gridWidth = canvas.width / GRID_SIZE;
    const gridHeight = canvas.height / GRID_SIZE;
    
    // 左右边界互通
    if (head.x < 0) {
        head.x = gridWidth - 1;
    } else if (head.x >= gridWidth) {
        head.x = 0;
    }
    
    // 上下边界互通
    if (head.y < 0) {
        head.y = gridHeight - 1;
    } else if (head.y >= gridHeight) {
        head.y = 0;
    }
    
    // 添加新头部
    snake.unshift(head);
    
    // 检查是否吃到食物
    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    
    if (didEatFood) {
        // 增加分数
        score += 10;
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // 创建新的食物
        createFood();
    } else {
        // 如果没吃到食物，移除尾部
        snake.pop();
    }
}

// 移动第二条蛇
function moveSnake2() {
    // 更新方向
    direction2 = nextDirection2;
    
    // 创建新的头部位置
    const head = {x: snake2[0].x, y: snake2[0].y};
    
    // 根据当前方向改变头部位置
    switch(direction2) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 处理边界穿越
    const gridWidth = canvas.width / GRID_SIZE;
    const gridHeight = canvas.height / GRID_SIZE;
    
    // 左右边界互通
    if (head.x < 0) {
        head.x = gridWidth - 1;
    } else if (head.x >= gridWidth) {
        head.x = 0;
    }
    
    // 上下边界互通
    if (head.y < 0) {
        head.y = gridHeight - 1;
    } else if (head.y >= gridHeight) {
        head.y = 0;
    }
    
    // 添加新头部
    snake2.unshift(head);
    
    // 检查是否吃到食物
    const didEatFood = snake2[0].x === food.x && snake2[0].y === food.y;
    
    if (didEatFood) {
        // 增加分数
        score2 += 10;
        score2Element.textContent = score2;
        
        // 创建新的食物
        createFood();
    } else {
        // 如果没吃到食物，移除尾部
        snake2.pop();
    }
}

// 创建食物
function createFood() {
    const gridWidth = canvas.width / GRID_SIZE;
    const gridHeight = canvas.height / GRID_SIZE;
    
    // 随机生成食物位置
    food = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
    };
    
    // 确保食物不会出现在蛇身上
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        createFood(); // 递归调用，重新生成食物
    }
}

// 绘制食物
function drawFood() {
    const x = food.x * GRID_SIZE;
    const y = food.y * GRID_SIZE;
    
    ctx.fillStyle = FOOD_COLOR;
    ctx.strokeStyle = FOOD_BORDER_COLOR;
    
    ctx.beginPath();
    ctx.arc(x + GRID_SIZE/2, y + GRID_SIZE/2, GRID_SIZE/2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    
    // 检查是否撞到自己(从第1个开始比较，因为第0个是头)
    const hitSelf = snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
    
    let player1Lost = false;
    let player2Lost = false;
    
    if (hitSelf) {
        player1Lost = true;
    }
    
    // 双人模式下的额外碰撞检测
    if (isMultiplayer) {
        const head2 = snake2[0];
        
        // 检查第二条蛇是否撞到自己
        const hitSelf2 = snake2.slice(1).some(segment => segment.x === head2.x && segment.y === head2.y);
        
        if (hitSelf2) {
            player2Lost = true;
        }
        
        // 检查两条蛇是否相撞
        const snakesCollided = snake.some(segment => segment.x === head2.x && segment.y === head2.y) || 
                              snake2.some(segment => segment.x === head.x && segment.y === head.y);
        
        if (snakesCollided) {
            // 如果蛇头相撞，两条蛇都输
            if (head.x === head2.x && head.y === head2.y) {
                player1Lost = true;
                player2Lost = true;
            } else {
                // 判断哪条蛇的头撞到了另一条蛇的身体
                const snake1HitSnake2 = snake2.some(segment => segment.x === head.x && segment.y === head.y);
                const snake2HitSnake1 = snake.some(segment => segment.x === head2.x && segment.y === head2.y);
                
                if (snake1HitSnake2) player1Lost = true;
                if (snake2HitSnake1) player2Lost = true;
            }
        }
        
        // 双人模式下的独立死亡机制
        if ((player1Lost && !player2Lost) || (!player1Lost && player2Lost)) {
            if (player1Lost) {
                // 标记玩家1已死亡，但保留蛇身显示
                // 显示提示消息
                const message = document.createElement('div');
                message.textContent = '玩家1已死亡，等待玩家2...';
                message.style.position = 'absolute';
                message.style.top = '50%';
                message.style.left = '25%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                message.style.color = 'white';
                message.style.padding = '10px';
                message.style.borderRadius = '5px';
                message.style.zIndex = '100';
                message.id = 'player1DeadMessage';
                if (!document.getElementById('player1DeadMessage')) {
                    document.querySelector('.canvas-container').appendChild(message);
                }
                return { player1Dead: true, player2Dead: false };
            } else {
                // 标记玩家2已死亡，但保留蛇身显示
                // 显示提示消息
                const message = document.createElement('div');
                message.textContent = '玩家2已死亡，等待玩家1...';
                message.style.position = 'absolute';
                message.style.top = '50%';
                message.style.left = '75%';
                message.style.transform = 'translate(-50%, -50%)';
                message.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                message.style.color = 'white';
                message.style.padding = '10px';
                message.style.borderRadius = '5px';
                message.style.zIndex = '100';
                message.id = 'player2DeadMessage';
                if (!document.getElementById('player2DeadMessage')) {
                    document.querySelector('.canvas-container').appendChild(message);
                }
                return { player1Dead: false, player2Dead: true };
            }
        }
    }
    
    // 如果是单人模式或两个玩家都输了，结束游戏
    if (player1Lost || player2Lost) {
        // 单人模式下直接结束
        if (!isMultiplayer) {
            endGame();
            return null;
        }
        
        // 双人模式下，只有当两个玩家都死亡时才结束游戏
        if (isMultiplayer && player1Lost && player2Lost) {
            endGame();
            return null;
        }
    }
    
    return null;
}

// 重置玩家1
function resetPlayer1() {
    const centerX = Math.floor((canvas.width / GRID_SIZE) / 2);
    const centerY = Math.floor((canvas.height / GRID_SIZE) / 2);
    
    snake = [
        {x: centerX, y: centerY},
        {x: centerX - 1, y: centerY},
        {x: centerX - 2, y: centerY}
    ];
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
}

// 重置玩家2
function resetPlayer2() {
    const centerX = Math.floor((canvas.width / GRID_SIZE) / 2);
    const centerY = Math.floor((canvas.height / GRID_SIZE) / 2);
    
    snake2 = [
        {x: centerX, y: centerY + 5},
        {x: centerX + 1, y: centerY + 5},
        {x: centerX + 2, y: centerY + 5}
    ];
    
    direction2 = 'left';
    nextDirection2 = 'left';
    score2 = 0;
    score2Element.textContent = score2;
}

// 结束游戏
function endGame() {
    gameOver = true;
    clearInterval(gameInterval);
    
    // 显示游戏结束界面
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// 重新开始游戏
function restartGame() {
    startGame();
}

// 通过键盘改变方向
function changeDirection(event) {
    // 防止蛇反向移动
    if (isPaused && event.code !== 'Space') return;
    
    const keyPressed = event.key;
    
    // 玩家1控制
    if (keyPressed === keyConfig.player1.up) {
        if (direction !== 'down') nextDirection = 'up';
        event.preventDefault();
    } else if (keyPressed === keyConfig.player1.down) {
        if (direction !== 'up') nextDirection = 'down';
        event.preventDefault();
    } else if (keyPressed === keyConfig.player1.left) {
        if (direction !== 'right') nextDirection = 'left';
        event.preventDefault();
    } else if (keyPressed === keyConfig.player1.right) {
        if (direction !== 'left') nextDirection = 'right';
        event.preventDefault();
    }
    
    // 玩家2控制（仅在双人模式下）
    if (isMultiplayer) {
        if (keyPressed === keyConfig.player2.up) {
            if (direction2 !== 'down') nextDirection2 = 'up';
            event.preventDefault();
        } else if (keyPressed === keyConfig.player2.down) {
            if (direction2 !== 'up') nextDirection2 = 'down';
            event.preventDefault();
        } else if (keyPressed === keyConfig.player2.left) {
            if (direction2 !== 'right') nextDirection2 = 'left';
            event.preventDefault();
        } else if (keyPressed === keyConfig.player2.right) {
            if (direction2 !== 'left') nextDirection2 = 'right';
            event.preventDefault();
        }
    }
    
    // 空格键功能：开始游戏或暂停/继续
    if (keyPressed === ' ') {
        if (gameOver || startScreen.classList.contains('hidden') === false) {
            // 游戏未开始或已结束 0.05秒延时后开始游戏 按空格开始游戏
            setTimeout(() => {
                startGame();
            }, 50);
        } else {
            // 游戏进行中，按空格暂停/继续
            togglePause();
        }
        event.preventDefault();
    }
}

// 通过屏幕按钮改变方向
function changeDirectionButton(newDirection) {
    if (isPaused) return;
    
    switch(newDirection) {
        case 'up':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'down':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'left':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'right':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
}

// 暂停/继续游戏
function togglePause() {
    isPaused = !isPaused;
    pauseIndicator.classList.toggle('hidden', !isPaused);
    pauseButton.textContent = isPaused ? '继续' : '暂停';
}

// 切换多人模式
function toggleMultiplayerMode() {
    isMultiplayer = !isMultiplayer;
    modeToggleButton.textContent = isMultiplayer ? '切换单人模式' : '切换双人模式';
    
    // 更新开始界面的提示
    const startScreenText = document.querySelector('#startScreen p');
    if (isMultiplayer) {
        startScreenText.innerHTML = `玩家1：${keyConfig.player1.up}/${keyConfig.player1.left}/${keyConfig.player1.down}/${keyConfig.player1.right}控制<br>玩家2：${keyConfig.player2.up}/${keyConfig.player2.left}/${keyConfig.player2.down}/${keyConfig.player2.right}键控制`;
        score2Container.style.display = 'block';
    } else {
        startScreenText.innerHTML = `使用${keyConfig.player1.up}/${keyConfig.player1.left}/${keyConfig.player1.down}/${keyConfig.player1.right}控制蛇的移动`;
        score2Container.style.display = 'none';
    }
    
    // 重置游戏
    resetGame();
}

// 打开键位配置面板
function openKeyConfig() {
    // 创建键位配置面板
    const keyConfigPanel = document.createElement('div');
    keyConfigPanel.id = 'keyConfigPanel';
    keyConfigPanel.style.position = 'absolute';
    keyConfigPanel.style.top = '50%';
    keyConfigPanel.style.left = '50%';
    keyConfigPanel.style.transform = 'translate(-50%, -50%)';
    keyConfigPanel.style.backgroundColor = 'white';
    keyConfigPanel.style.padding = '20px';
    keyConfigPanel.style.borderRadius = '10px';
    keyConfigPanel.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    keyConfigPanel.style.zIndex = '1000';
    keyConfigPanel.style.width = '300px';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = '自定义键位设置';
    title.style.marginBottom = '15px';
    keyConfigPanel.appendChild(title);
    
    // 创建玩家1键位设置
    const player1Title = document.createElement('h4');
    player1Title.textContent = '玩家1键位';
    keyConfigPanel.appendChild(player1Title);
    
    const player1Keys = ['up', 'down', 'left', 'right'];
    const player1Labels = ['上', '下', '左', '右'];
    
    player1Keys.forEach((key, index) => {
        const container = document.createElement('div');
        container.style.margin = '5px 0';
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        
        const label = document.createElement('label');
        label.textContent = player1Labels[index] + ': ';
        container.appendChild(label);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = keyConfig.player1[key];
        input.id = `player1-${key}`;
        input.style.width = '100px';
        input.addEventListener('keydown', function(e) {
            e.preventDefault();
            this.value = e.key;
        });
        container.appendChild(input);
        
        keyConfigPanel.appendChild(container);
    });
    
    // 创建玩家2键位设置
    const player2Title = document.createElement('h4');
    player2Title.textContent = '玩家2键位';
    player2Title.style.marginTop = '15px';
    keyConfigPanel.appendChild(player2Title);
    
    const player2Keys = ['up', 'down', 'left', 'right'];
    const player2Labels = ['上', '下', '左', '右'];
    
    player2Keys.forEach((key, index) => {
        const container = document.createElement('div');
        container.style.margin = '5px 0';
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        
        const label = document.createElement('label');
        label.textContent = player2Labels[index] + ': ';
        container.appendChild(label);
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = keyConfig.player2[key];
        input.id = `player2-${key}`;
        input.style.width = '100px';
        input.addEventListener('keydown', function(e) {
            e.preventDefault();
            this.value = e.key;
        });
        container.appendChild(input);
        
        keyConfigPanel.appendChild(container);
    });
    
    // 添加保存和取消按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.marginTop = '20px';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.addEventListener('click', function() {
        // 保存玩家1键位
        player1Keys.forEach(key => {
            keyConfig.player1[key] = document.getElementById(`player1-${key}`).value;
        });
        
        // 保存玩家2键位
        player2Keys.forEach(key => {
            keyConfig.player2[key] = document.getElementById(`player2-${key}`).value;
        });
        
        // 保存到localStorage
        localStorage.setItem('keyConfig', JSON.stringify(keyConfig));
        
        // 更新开始界面的提示
        const startScreenText = document.querySelector('#startScreen p');
        if (isMultiplayer) {
            startScreenText.innerHTML = `玩家1：${keyConfig.player1.up}/${keyConfig.player1.left}/${keyConfig.player1.down}/${keyConfig.player1.right}控制<br>玩家2：${keyConfig.player2.up}/${keyConfig.player2.left}/${keyConfig.player2.down}/${keyConfig.player2.right}键控制`;
        } else {
            startScreenText.innerHTML = `使用${keyConfig.player1.up}/${keyConfig.player1.left}/${keyConfig.player1.down}/${keyConfig.player1.right}控制蛇的移动`;
        }
        
        // 关闭面板
        document.body.removeChild(keyConfigPanel);
    });
    buttonContainer.appendChild(saveButton);
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(keyConfigPanel);
    });
    buttonContainer.appendChild(cancelButton);
    
    keyConfigPanel.appendChild(buttonContainer);
    
    // 添加到页面
    document.body.appendChild(keyConfigPanel);
}

// 游戏中途重开功能
function restartGameInProgress() {
    // 移除死亡提示（如果有）
    const player1DeadMessage = document.getElementById('player1DeadMessage');
    const player2DeadMessage = document.getElementById('player2DeadMessage');
    
    if (player1DeadMessage) {
        player1DeadMessage.parentNode.removeChild(player1DeadMessage);
    }
    
    if (player2DeadMessage) {
        player2DeadMessage.parentNode.removeChild(player2DeadMessage);
    }
    
    // 重置游戏
    resetGame();
    
    // 如果游戏已经结束，隐藏游戏结束界面
    gameOverScreen.classList.add('hidden');
    
    // 如果游戏已经暂停，恢复游戏
    if (isPaused) {
        togglePause();
    }
    
    // 清除之前的定时器并重新开始游戏循环
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameLoop();
}

// 当页面加载完毕初始化游戏
window.onload = init;