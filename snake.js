class Snake {
    constructor() {
        this.segments = [
            {x: 10, y: 10},
            {x: 9, y: 10},
            {x: 8, y: 10}
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.isAccelerating = false;
    }

    move(hasEaten) {
        const head = {...this.segments[0]};

        this.direction = this.nextDirection;

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.segments.unshift(head);
        if (!hasEaten) {
            this.segments.pop();
        }
    }

    setDirection(direction) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[direction] !== this.direction) {
            this.nextDirection = direction;
        }
    }

    setAcceleration(isAccelerating) {
        this.isAccelerating = isAccelerating;
    }

    checkCollision(gridSize) {
        const head = this.segments[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridSize || 
            head.y < 0 || head.y >= gridSize) {
            return true;
        }

        // 检查是否撞到自己
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && 
                head.y === this.segments[i].y) {
                return true;
            }
        }

        return false;
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
        this.speed = 150;
        this.normalSpeed = 150;
        this.acceleratedSpeed = 100; // 1.5倍速

        this.bindControls();
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

        this.draw();
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