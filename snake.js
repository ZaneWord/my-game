class Snake {
    constructor() {
        this.segments = [{ x: 10, y: 10 }];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.isAccelerating = false;
    }

    setDirection(newDirection) {
        const opposites = {
            up: 'down',
            down: 'up',
            left: 'right',
            right: 'left'
        };

        if (newDirection && opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }

    setAcceleration(isAccelerating) {
        this.isAccelerating = isAccelerating;
    }

    move(grow = false) {
        this.direction = this.nextDirection;

        const head = { ...this.segments[0] };

        switch (this.direction) {
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

        this.segments.unshift(head);
        if (!grow) {
            this.segments.pop();
        }
    }

    checkCollision(gridSize) {
        const head = this.segments[0];

        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return true;
        }

        // 检查是否撞到自己
        return this.segments.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // 20x20的网格
        this.tileSize = this.canvas.width / this.gridSize;
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.speed = 200;
        this.normalSpeed = 200; // 降低到原来的70%左右
        this.acceleratedSpeed = 140; // 降低到原来的70%左右
        this.foodColor = this.getRandomColor();
        this.gridColor = '#f0f0f0';
        this.snakeColors = ['#4CAF50', '#388E3C', '#2E7D32', '#1B5E20'];

        this.bindControls();
        this.bindTouchControls();
    }

    generateFood() {
        while (true) {
            const food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };

            // 确保食物不会生成在蛇身上
            let onSnake = false;
            for (const segment of this.snake.segments) {
                if (food.x === segment.x && food.y === segment.y) {
                    onSnake = true;
                    break;
                }
            }

            if (!onSnake) {
                this.foodColor = this.getRandomColor();
                return food;
            }
        }
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            let newDirection = '';
            switch(e.key) {
                case 'ArrowUp':
                    newDirection = 'up';
                    break;
                case 'ArrowDown':
                    newDirection = 'down';
                    break;
                case 'ArrowLeft':
                    newDirection = 'left';
                    break;
                case 'ArrowRight':
                    newDirection = 'right';
                    break;
            }
            if (newDirection && newDirection === this.snake.direction) {
                this.snake.setAcceleration(true);
                this.speed = this.acceleratedSpeed;
            }
            this.snake.setDirection(newDirection);
        });

        document.addEventListener('keyup', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.snake.setAcceleration(false);
                this.speed = this.normalSpeed;
            }
        });
    }

    bindTouchControls() {
        const canvas = this.canvas;
        let touchStartTime = 0;
        let lastTouchPosition = null;

        const getDirectionFromPosition = (touchX, touchY) => {
            // 计算触摸点相对于棋盘中心的位置
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const dx = touchX - centerX;
            const dy = touchY - centerY;

            // 使用反正切函数计算角度（弧度）
            const angle = Math.atan2(dy, dx);
            // 将弧度转换为角度
            const degrees = angle * (180 / Math.PI);

            // 根据角度判断方向（将360度分为四个90度的扇区）
            if (degrees >= -45 && degrees < 45) {
                return 'right';
            } else if (degrees >= 45 && degrees < 135) {
                return 'down';
            } else if (degrees >= -135 && degrees < -45) {
                return 'up';
            } else {
                return 'left';
            }
        };

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            touchStartTime = Date.now();
            lastTouchPosition = { x: touchX, y: touchY };

            const direction = getDirectionFromPosition(touchX, touchY);
            this.snake.setDirection(direction);
            this.snake.setAcceleration(true);
            this.speed = this.acceleratedSpeed;
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            // 只有当触摸位置发生显著变化时才更新方向
            if (lastTouchPosition && (
                Math.abs(touchX - lastTouchPosition.x) > 10 ||
                Math.abs(touchY - lastTouchPosition.y) > 10
            )) {
                const direction = getDirectionFromPosition(touchX, touchY);
                this.snake.setDirection(direction);
                lastTouchPosition = { x: touchX, y: touchY };
            }
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.snake.setAcceleration(false);
            this.speed = this.normalSpeed;
            lastTouchPosition = null;
        });

        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.snake.setAcceleration(false);
            this.speed = this.normalSpeed;
            lastTouchPosition = null;
        });
    }

    update() {
        if (this.gameOver) return;

        const head = this.snake.segments[0];
        const hasEaten = head.x === this.food.x && head.y === this.food.y;

        if (hasEaten) {
            this.score += 10;
            this.food = this.generateFood();
            document.getElementById('score').textContent = `分数: ${this.score}`;
            // 加快游戏速度
            if (this.normalSpeed > 50) {
                this.normalSpeed -= 5;
                this.acceleratedSpeed = Math.ceil(this.normalSpeed / 1.5);
                this.speed = this.snake.isAccelerating ? this.acceleratedSpeed : this.normalSpeed;
            }
        }

        this.snake.move(hasEaten);

        if (this.snake.checkCollision(this.gridSize)) {
            this.gameOver = true;
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('final-score').textContent = this.score;
            return;
        }

        // 只在必要时重绘
        requestAnimationFrame(() => this.draw());
        setTimeout(() => this.update(), this.speed);
    }

    getRandomColor() {
        const colors = [
            '#FF5252', // 红色
            '#FF4081', // 粉色
            '#7C4DFF', // 深紫色
            '#536DFE', // 靛蓝色
            '#448AFF', // 蓝色
            '#40C4FF', // 浅蓝色
            '#18FFFF', // 青色
            '#64FFDA', // 蓝绿色
            '#69F0AE', // 绿色
            '#B2FF59', // 浅绿色
            '#EEFF41', // 酸橙色
            '#FFFF00', // 黄色
            '#FFD740', // 琥珀色
            '#FFAB40', // 橙色
            '#FF6E40'  // 深橙色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格背景
        this.drawGrid();

        // 绘制食物
        this.drawFood();

        // 绘制蛇
        this.drawSnake();
    }

    drawGrid() {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5;

        // 绘制垂直线
        for (let x = 0; x <= this.gridSize; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.tileSize, 0);
            this.ctx.lineTo(x * this.tileSize, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.gridSize; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.tileSize);
            this.ctx.lineTo(this.canvas.width, y * this.tileSize);
            this.ctx.stroke();
        }
    }

    drawFood() {
        const centerX = (this.food.x + 0.5) * this.tileSize;
        const centerY = (this.food.y + 0.5) * this.tileSize;
        const radius = this.tileSize / 2 * 0.8;

        // 绘制圆形食物
        this.ctx.fillStyle = this.foodColor;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSnake() {
        // 绘制蛇身体
        this.snake.segments.forEach((segment, index) => {
            // 为蛇身体创建渐变色
            const colorIndex = index % this.snakeColors.length;
            const segmentColor = this.snakeColors[colorIndex];
            
            this.ctx.fillStyle = segmentColor;
            
            // 圆角矩形
            const x = segment.x * this.tileSize;
            const y = segment.y * this.tileSize;
            const size = this.tileSize * 0.9;
            const offset = (this.tileSize - size) / 2;
            const radius = size / 4;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + offset + radius, y + offset);
            this.ctx.lineTo(x + offset + size - radius, y + offset);
            this.ctx.quadraticCurveTo(x + offset + size, y + offset, x + offset + size, y + offset + radius);
            this.ctx.lineTo(x + offset + size, y + offset + size - radius);
            this.ctx.quadraticCurveTo(x + offset + size, y + offset + size, x + offset + size - radius, y + offset + size);
            this.ctx.lineTo(x + offset + radius, y + offset + size);
            this.ctx.quadraticCurveTo(x + offset, y + offset + size, x + offset, y + offset + size - radius);
            this.ctx.lineTo(x + offset, y + offset + radius);
            this.ctx.quadraticCurveTo(x + offset, y + offset, x + offset + radius, y + offset);
            this.ctx.closePath();
            this.ctx.fill();
            
            // 为蛇头添加眼睛
            if (index === 0) {
                this.drawSnakeEyes(segment);
            }
        });
    }
    
    drawSnakeEyes(headSegment) {
        const x = headSegment.x * this.tileSize;
        const y = headSegment.y * this.tileSize;
        const eyeSize = this.tileSize / 6;
        const eyeOffset = this.tileSize / 4;
        
        // 根据蛇的方向确定眼睛位置
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        switch(this.snake.direction) {
            case 'up':
                leftEyeX = x + eyeOffset;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + this.tileSize - eyeOffset - eyeSize;
                rightEyeY = y + eyeOffset;
                break;
            case 'down':
                leftEyeX = x + eyeOffset;
                leftEyeY = y + this.tileSize - eyeOffset - eyeSize;
                rightEyeX = x + this.tileSize - eyeOffset - eyeSize;
                rightEyeY = y + this.tileSize - eyeOffset - eyeSize;
                break;
            case 'left':
                leftEyeX = x + eyeOffset;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + eyeOffset;
                rightEyeY = y + this.tileSize - eyeOffset - eyeSize;
                break;
            case 'right':
                leftEyeX = x + this.tileSize - eyeOffset - eyeSize;
                leftEyeY = y + eyeOffset;
                rightEyeX = x + this.tileSize - eyeOffset - eyeSize;
                rightEyeY = y + this.tileSize - eyeOffset - eyeSize;
                break;
        }
        
        // 绘制眼睛
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
        this.ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
        
        // 绘制瞳孔
        this.ctx.fillStyle = 'black';
        const pupilSize = eyeSize / 2;
        const pupilOffset = (eyeSize - pupilSize) / 2;
        this.ctx.fillRect(leftEyeX + pupilOffset, leftEyeY + pupilOffset, pupilSize, pupilSize);
        this.ctx.fillRect(rightEyeX + pupilOffset, rightEyeY + pupilOffset, pupilSize, pupilSize);
    }
}

let game;

function startGame() {
    document.getElementById('game-over').style.display = 'none';
    game = new Game();
    game.update();
}

startGame();