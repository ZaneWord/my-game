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

            if (!onSnake) return food;
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
        const controlButtons = document.querySelectorAll('.control-button');
        let touchStartTime = 0;
        let currentTouchButton = null;
        
        controlButtons.forEach(button => {
            const direction = button.dataset.direction;

            // 处理点击事件
            button.addEventListener('mousedown', () => {
                this.snake.setDirection(direction);
                touchStartTime = Date.now();
                this.snake.setAcceleration(true);
                this.speed = this.acceleratedSpeed;
                currentTouchButton = button;
            });

            button.addEventListener('mouseup', () => {
                this.snake.setAcceleration(false);
                this.speed = this.normalSpeed;
                currentTouchButton = null;
            });

            // 处理触摸事件
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.snake.setDirection(direction);
                touchStartTime = Date.now();
                this.snake.setAcceleration(true);
                this.speed = this.acceleratedSpeed;
                currentTouchButton = button;
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (currentTouchButton === button) {
                    this.snake.setAcceleration(false);
                    this.speed = this.normalSpeed;
                    currentTouchButton = null;
                }
            });

            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                if (currentTouchButton === button) {
                    this.snake.setAcceleration(false);
                    this.speed = this.normalSpeed;
                    currentTouchButton = null;
                }
            });
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

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制食物
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(
            this.food.x * this.tileSize,
            this.food.y * this.tileSize,
            this.tileSize,
            this.tileSize
        );

        // 绘制蛇
        this.snake.segments.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#006400' : '#008000';
            this.ctx.fillRect(
                segment.x * this.tileSize,
                segment.y * this.tileSize,
                this.tileSize,
                this.tileSize
            );
        });
    }
}

let game;

function startGame() {
    document.getElementById('game-over').style.display = 'none';
    game = new Game();
    game.update();
}

startGame();