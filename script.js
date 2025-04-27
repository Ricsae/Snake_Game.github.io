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
let gameLoopId;
let lastFrameTime = 0;
let isPaused = false;
let gameOver = false;
let direction = 'right';
let direction2 = 'left';
let nextDirection = 'right';
let nextDirection2 = 'left';

let isMultiplayer = false; // 是否为双人模式

// 添加按键缓冲队列
let keyBuffer = [];
let keyBuffer2 = [];
const KEY_BUFFER_MAX_SIZE = 3; // 缓冲队列最大长度

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
    lastFrameTime = performance.now(); // 初始化时间戳
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 重置游戏状态
function resetGame() {
    // 重置分数
    score = 0;
    score2 = 0;
    scoreElement.textContent = score;
    score2Element.textContent = score2;
    
    // 清空按键缓冲队列
    keyBuffer = [];
    keyBuffer2 = [];
    
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
    
    // 清除之前的动画帧请求
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
}

// 游戏主循环 (使用 requestAnimationFrame)
function gameLoop(currentTime) {
    if (gameOver) return;

    gameLoopId = requestAnimationFrame(gameLoop);

    const deltaTime = currentTime - lastFrameTime;

    // 控制游戏速度
    if (deltaTime < GAME_SPEED) {
        return;
    }
    lastFrameTime = currentTime;

    if (!isPaused) {
        // 添加玩家状态标记
        let player1Dead = false;
        let player2Dead = false;

        clearCanvas();

        // 检查碰撞并获取玩家状态
        const collisionStatus = checkCollision();
        player1Dead = collisionStatus.player1Dead;
        player2Dead = collisionStatus.player2Dead;

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

        // 如果是双人模式且其中一个玩家死亡，显示提示信息
        if (isMultiplayer) {
            if (player1Dead && !document.getElementById('player1DeadMessage')) {
                displayPlayerDeadMessage(1);
            }
            if (player2Dead && !document.getElementById('player2DeadMessage')) {
                displayPlayerDeadMessage(2);
            }
        }

        // 检查游戏结束条件
        let shouldEndGame = false;
        if (!isMultiplayer) {
            shouldEndGame = player1Dead;
        } else {
            // 双人模式下，两个都死了才算结束
            shouldEndGame = player1Dead && player2Dead;
        }

        if (shouldEndGame) {
            endGame();
            // 不需要 return，因为 endGame 会设置 gameOver = true, 循环将在下一帧开始时停止
        }
    }
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

// --- 蛇移动逻辑重构 ---

// 从缓冲队列更新方向
function updateDirectionFromBuffer(keyBuffer, currentDirection, nextDirectionRef) {
    if (keyBuffer.length > 0) {
        const nextDir = keyBuffer.shift();
        // 确保不会直接反向
        if ((nextDir === 'up' && currentDirection !== 'down') ||
            (nextDir === 'down' && currentDirection !== 'up') ||
            (nextDir === 'left' && currentDirection !== 'right') ||
            (nextDir === 'right' && currentDirection !== 'left')) {
            nextDirectionRef.value = nextDir;
        }
    }
    return nextDirectionRef.value; // 返回更新后的方向
}

// 计算新蛇头位置
function calculateNewHeadPosition(head, direction) {
    const newHead = { x: head.x, y: head.y };
    switch (direction) {
        case 'up':
            newHead.y -= 1;
            break;
        case 'down':
            newHead.y += 1;
            break;
        case 'left':
            newHead.x -= 1;
            break;
        case 'right':
            newHead.x += 1;
            break;
    }
    return newHead;
}

// 处理边界穿越
function handleBoundaryWrapping(head, gridWidth, gridHeight) {
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
}

// 处理吃到食物的逻辑
function handleFoodCollision(snakeArr, foodPos, scoreData) {
    const head = snakeArr[0];
    const didEatFood = head.x === foodPos.x && head.y === foodPos.y;

    if (didEatFood) {
        scoreData.score += 10;
        scoreData.scoreElement.textContent = scoreData.score;

        // 更新最高分 (针对玩家1)
        if (scoreData.isPlayer1 && scoreData.score > highScore) {
            highScore = scoreData.score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        // 注意：双人模式下的最高分逻辑已移至 endGame

        createFood(); // 创建新食物
    } else {
        snakeArr.pop(); // 没吃到食物，移除尾部
    }
    return didEatFood;
}

// 通用移动蛇的函数
function moveSnakeGeneric(snakeArr, directionRef, nextDirectionRef, keyBuffer, scoreData) {
    // 更新方向
    const currentDirection = updateDirectionFromBuffer(keyBuffer, directionRef.value, nextDirectionRef);
    directionRef.value = currentDirection;

    // 计算新头部位置
    const head = snakeArr[0];
    const newHead = calculateNewHeadPosition(head, currentDirection);

    // 处理边界
    const gridWidth = canvas.width / GRID_SIZE;
    const gridHeight = canvas.height / GRID_SIZE;
    handleBoundaryWrapping(newHead, gridWidth, gridHeight);

    // 添加新头部
    snakeArr.unshift(newHead);

    // 处理食物碰撞
    handleFoodCollision(snakeArr, food, scoreData);
}

// 移动蛇 (玩家1)
function moveSnake() {
    const directionRef = { value: direction };
    const nextDirectionRef = { value: nextDirection };
    const scoreData = { score: score, scoreElement: scoreElement, isPlayer1: true };

    moveSnakeGeneric(snake, directionRef, nextDirectionRef, keyBuffer, scoreData);

    // 更新全局变量
    direction = directionRef.value;
    nextDirection = nextDirectionRef.value;
    score = scoreData.score;
}

// 移动第二条蛇 (玩家2)
function moveSnake2() {
    const directionRef = { value: direction2 };
    const nextDirectionRef = { value: nextDirection2 };
    // 获取 score2Element
    const score2Elem = document.getElementById('score2') || score2Element; // 确保获取到元素
    const scoreData = { score: score2, scoreElement: score2Elem, isPlayer1: false };

    moveSnakeGeneric(snake2, directionRef, nextDirectionRef, keyBuffer2, scoreData);

    // 更新全局变量
    direction2 = directionRef.value;
    nextDirection2 = nextDirectionRef.value;
    score2 = scoreData.score;
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
    
    // 确保食物不会出现在蛇1身上
    let collision = snake.some(segment => segment.x === food.x && segment.y === food.y);
    // 如果是双人模式，也确保食物不会出现在蛇2身上
    if (!collision && isMultiplayer && snake2.some(segment => segment.x === food.x && segment.y === food.y)) {
        collision = true;
    }

    if (collision) {
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

// --- 碰撞检测重构 ---

// 检查蛇是否撞到自己
function checkSelfCollision(snakeArr) {
    const head = snakeArr[0];
    return snakeArr.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

// 检查两条蛇是否相撞
function checkSnakeCollision(snake1, snake2) {
    const head1 = snake1[0];
    const head2 = snake2[0];

    // 检查蛇头是否相撞
    if (head1.x === head2.x && head1.y === head2.y) {
        return { player1Hit: true, player2Hit: true };
    }

    // 检查蛇1头是否撞到蛇2身体
    const snake1HitSnake2Body = snake2.slice(1).some(segment => segment.x === head1.x && segment.y === head1.y);
    // 检查蛇2头是否撞到蛇1身体
    const snake2HitSnake1Body = snake1.slice(1).some(segment => segment.x === head2.x && segment.y === head2.y);

    return { player1Hit: snake1HitSnake2Body, player2Hit: snake2HitSnake1Body };
}

// 显示玩家死亡信息
function displayPlayerDeadMessage(playerNumber) {
    const messageId = `player${playerNumber}DeadMessage`;
    if (document.getElementById(messageId)) return; // 防止重复显示

    const message = document.createElement('div');
    message.textContent = `玩家${playerNumber}已死亡，等待另一位玩家...`;
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = playerNumber === 1 ? '25%' : '75%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    message.style.color = 'white';
    message.style.padding = '10px';
    message.style.borderRadius = '5px';
    message.style.zIndex = '100';
    message.id = messageId;
    document.querySelector('.canvas-container').appendChild(message);
}

// 检查游戏是否结束 (移到 gameLoop 中处理)
/* function checkGameOver(player1Dead, player2Dead) {
    if (!isMultiplayer) {
        return player1Dead;
    } else {
        // 双人模式下，两个都死了才算结束
        return player1Dead && player2Dead;
    }
}*/

// 检查碰撞 (重构后)
function checkCollision() {
    let player1Dead = checkSelfCollision(snake);
    let player2Dead = false;

    if (isMultiplayer) {
        player2Dead = checkSelfCollision(snake2);

        const collisionResult = checkSnakeCollision(snake, snake2);
        player1Dead = player1Dead || collisionResult.player1Hit;
        player2Dead = player2Dead || collisionResult.player2Hit;
    }

    // 返回两个玩家的死亡状态
    return { player1Dead, player2Dead };

    // 注意：游戏结束逻辑 (endGame()) 和显示死亡信息 (displayPlayerDeadMessage) 的调用已移至 gameLoop
    // 这样可以保持 checkCollision 只负责检测碰撞状态
}

// 重置玩家1 (不再需要，合并到 resetGame)
/* function resetPlayer1() {
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
}*/

// 重置玩家2 (不再需要，合并到 resetGame)
/* function resetPlayer2() {
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
}*/

// 结束游戏
function endGame() {
    gameOver = true;
    // 取消动画帧请求
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    if (isMultiplayer && score2 > highScore) {
        highScore = score2;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    // 显示游戏结束界面
    finalScoreElement.textContent = isMultiplayer ? `玩家1: ${score}, 玩家2: ${score2}` : score;
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
        if (direction !== 'down') {
            // 将新方向添加到缓冲队列
            addToKeyBuffer('up');
        }
        event.preventDefault();
    } else if (keyPressed === keyConfig.player1.down) {
        if (direction !== 'up') {
            addToKeyBuffer('down');
        }
        event.preventDefault();
    } else if (keyPressed === keyConfig.player1.left) {
        if (direction !== 'right') {
            addToKeyBuffer('left');
        }
        event.preventDefault();
    } else if (keyPressed === keyConfig.player1.right) {
        if (direction !== 'left') {
            addToKeyBuffer('right');
        }
        event.preventDefault();
    }
    
    // 玩家2控制（仅在双人模式下）
    if (isMultiplayer) {
        if (keyPressed === keyConfig.player2.up) {
            if (direction2 !== 'down') {
                addToKeyBuffer2('up');
            }
            event.preventDefault();
        } else if (keyPressed === keyConfig.player2.down) {
            if (direction2 !== 'up') {
                addToKeyBuffer2('down');
            }
            event.preventDefault();
        } else if (keyPressed === keyConfig.player2.left) {
            if (direction2 !== 'right') {
                addToKeyBuffer2('left');
            }
            event.preventDefault();
        } else if (keyPressed === keyConfig.player2.right) {
            if (direction2 !== 'left') {
                addToKeyBuffer2('right');
            }
            event.preventDefault();
        }
    }
    
    // 空格键功能：开始游戏或暂停/继续
    if (keyPressed === ' ') {
        if (gameOver || startScreen.classList.contains('hidden') === false) {
            // 游戏未开始或已结束，按空格开始游戏
            // 添加0.05秒延时后开始游戏
            setTimeout(() => {
                startGame();
            }, 50);
            startGame();
        } else {
            // 游戏进行中，按空格暂停/继续
            togglePause();
        }
        event.preventDefault();
    }
}

// 添加按键到缓冲队列的函数
function addToKeyBuffer(newDirection) {
    // 如果缓冲区为空或者最后一个方向与新方向不同，才添加
    if (keyBuffer.length === 0 || keyBuffer[keyBuffer.length - 1] !== newDirection) {
        keyBuffer.push(newDirection);
        // 保持缓冲区不超过最大长度
        if (keyBuffer.length > KEY_BUFFER_MAX_SIZE) {
            keyBuffer.shift(); // 移除最旧的方向
        }
    }
}

// 玩家2的按键缓冲函数
function addToKeyBuffer2(newDirection) {
    if (keyBuffer2.length === 0 || keyBuffer2[keyBuffer2.length - 1] !== newDirection) {
        keyBuffer2.push(newDirection);
        if (keyBuffer2.length > KEY_BUFFER_MAX_SIZE) {
            keyBuffer2.shift();
        }
    }
}

// 为触屏按钮添加缓冲支持
function changeDirectionButton(newDirection) {
    if (isPaused) return;
    
    // 根据当前模式决定控制哪条蛇
    if (!isMultiplayer) {
        // 单人模式
        if ((newDirection === 'up' && direction !== 'down') ||
            (newDirection === 'down' && direction !== 'up') ||
            (newDirection === 'left' && direction !== 'right') ||
            (newDirection === 'right' && direction !== 'left')) {
            addToKeyBuffer(newDirection);
        }
    } else {
        // 双人模式下，屏幕按钮控制玩家1
        if ((newDirection === 'up' && direction !== 'down') ||
            (newDirection === 'down' && direction !== 'up') ||
            (newDirection === 'left' && direction !== 'right') ||
            (newDirection === 'right' && direction !== 'left')) {
            addToKeyBuffer(newDirection);
        }
    }
}

// 暂停/继续游戏
function togglePause() {
    isPaused = !isPaused;
    pauseIndicator.classList.toggle('hidden', !isPaused);
    pauseButton.textContent = isPaused ? '继续' : '暂停';

    if (isPaused) {
        // 暂停时取消动画帧请求
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
    } else {
        // 继续时重置时间戳并重新启动动画帧请求
        lastFrameTime = performance.now();
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// 切换多人模式
function toggleMultiplayerMode() {
    // 切换模式
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
    
    // 清空画布
    if (ctx) {
        clearCanvas();
    }
    
    // 停止当前游戏
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // 重置游戏状态
    gameOver = false;
    isPaused = false;
    
    // 显示开始界面
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    pauseIndicator.classList.add('hidden');
    
    // 移除玩家死亡提示（如果存在）
    const player1DeadMessage = document.getElementById('player1DeadMessage');
    const player2DeadMessage = document.getElementById('player2DeadMessage');
    if (player1DeadMessage) player1DeadMessage.remove();
    if (player2DeadMessage) player2DeadMessage.remove();
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
    
    // 清除之前的动画帧请求并重新开始游戏循环
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    lastFrameTime = performance.now(); // 重置时间戳
    gameLoopId = requestAnimationFrame(gameLoop);
}

// 当页面加载完毕初始化游戏
window.onload = init;