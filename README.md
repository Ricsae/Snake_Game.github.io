# 贪吃蛇游戏

这是一个使用 HTML、CSS 和 JavaScript 实现的经典贪吃蛇游戏。

## 功能

*   **单人模式**：经典的贪吃蛇玩法。
*   **双人模式**：支持两名玩家在同一屏幕上对战。
*   **自定义键位**：允许玩家自定义控制按键。
*   **触屏控制**：支持通过屏幕按钮进行游戏（主要控制玩家1）。
*   **暂停/继续**：可以随时暂停和继续游戏。
*   **最高分记录**：使用 `localStorage` 记录并显示最高分。
*   **按键缓冲**：实现按键缓冲，使操作更流畅。
*   **边界穿越**：蛇可以从屏幕的一边穿到另一边。
*   **游戏中重开**：可以在游戏进行中或结束后点击按钮重新开始。

## 如何运行

1.  克隆或下载此仓库。
2.  在浏览器中打开 `index.html` 文件。

## 主要文件

*   `<mcfile name="index.html" path="c:\Users\Ricsae\Desktop\Snake_Game\index.html"></mcfile>`：游戏页面的 HTML 结构。
*   `<mcfile name="style.css" path="c:\Users\Ricsae\Desktop\Snake_Game\style.css"></mcfile>`：游戏的 CSS 样式。
*   `<mcfile name="script.js" path="c:\Users\Ricsae\Desktop\Snake_Game\script.js"></mcfile>`：游戏的主要逻辑和功能实现。

## `script.js` 中的主要函数

*   `init()`: 初始化游戏设置，包括画布、分数、事件监听器和按钮。
*   `startGame()`: 开始新游戏，重置状态并启动游戏循环。
*   `resetGame()`: 重置游戏变量，如分数、蛇的位置、方向和食物。
*   `gameLoop(currentTime)`: 游戏主循环，处理游戏逻辑更新、绘图和碰撞检测。
*   `clearCanvas()`: 清空画布。
*   `drawSnake()`, `drawSnake2()`, `drawSnakeSegment()`: 绘制蛇的函数。
*   `moveSnake()`, `moveSnake2()`, `moveSnakeGeneric()`: 处理蛇移动的逻辑。
*   `createFood()`, `drawFood()`: 创建和绘制食物。
*   `checkCollision()`, `checkSelfCollision()`, `checkSnakeCollision()`: 检测各种碰撞。
*   `endGame()`: 结束游戏，显示游戏结束界面并更新最高分。
*   `restartGame()`: 重新开始游戏。
*   `changeDirection(event)`, `changeDirectionButton()`: 处理玩家输入（键盘和按钮）。
*   `addToKeyBuffer()`, `addToKeyBuffer2()`: 将按键添加到缓冲队列。
*   `togglePause()`: 暂停或继续游戏。
*   `toggleMultiplayerMode()`: 切换单人/双人模式。
*   `openKeyConfig()`: 打开键位配置面板。
*   `restartGameInProgress()`: 游戏中途重新开始。