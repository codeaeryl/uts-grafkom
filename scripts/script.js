import GrafLib from "./GrafLib.js";

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const graph = new GrafLib(canvas.width, canvas.height, imgData);

// global variable
const cellSize = 100;
const cellGap = 3;
const gameGrid = [];
const defenders = [];
let numberOfResources = 300;
const enemies = [];
const enemyPosition = [];
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1
}

let canvasPosition = canvas.getBoundingClientRect();

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', (e) => {
    mouse.x = undefined;
    mouse.y = undefined;
});

// colors
const black = { r: 0, g: 0, b: 0, a: 255 };
const blue = { r: 0, g: 0, b: 255, a: 255 };
const red = { r: 255, g: 0, b: 0, a: 255 };

// game board
const controlsBar = {
    width: canvas.width,
    height: cellSize
}

function drawControlsBar() {
    const points = [
        { x: 0, y: 0 },
        { x: controlsBar.width, y: 0 },
        { x: controlsBar.width, y: controlsBar.height },
        { x: 0, y: controlsBar.height }
    ]
    graph.fill_polygon(points, blue);
}

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            const points = [{
                x: this.x,
                y: this.y,
            }, {
                x: this.x + this.width,
                y: this.y,
            }, {
                x: this.x + this.width,
                y: this.y + this.height,
            }, {
                x: this.x,
                y: this.y + this.height,
            }]
            graph.polygon(points, black);
        }
    }
}

function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y));
        }
    }
}

createGrid();

function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
    }
}

// projectiles
// defenders
class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.shooting = false;
        this.health = 100;
        this.projectile = [];
        this.timer = 0;
    }
    draw() {
        const points = [{
            x: this.x,
            y: this.y,
        }, {
            x: this.x + this.width,
            y: this.y,
        }, {
            x: this.x + this.width,
            y: this.y + this.height,
        }, {
            x: this.x,
            y: this.y + this.height,
        }]
        graph.fill_polygon(points, blue);
    }

    drawText() {
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial'
        ctx.fillText(Math.floor(this.health), Math.floor(this.x + this.width / 3), Math.floor(this.y + this.height / 2));
    }
}

canvas.addEventListener('click', () => {
    const gridPositionX = mouse.x - mouse.x % cellSize;
    const gridPositionY = mouse.y - mouse.y % cellSize;

    if (gridPositionY < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
            return;
    }

    let defenderCost = 100;
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= 100;
    }
});

function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && enemies[j] && collision(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= 0.2
            }
            if (defenders[i] && defenders[i].health <= 0) {
                defenders.splice(i, 1);
                i--;
                enemies[j].movement = enemies[j].speed;
            }

        }
    }
}

function handleDefendersText() {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].drawText();
    }
}

// enemies
class Enemy {
    constructor(verticalPosition) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize;
        this.height = cellSize;
        this.speed = Math.random() * 0.2 + 0.4;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
    }

    update() {
        this.x -= this.movement;
    }

    draw() {
        const points = [{
            x: this.x,
            y: this.y,
        }, {
            x: this.x + this.width,
            y: this.y,
        }, {
            x: this.x + this.width,
            y: this.y + this.height,
        }, {
            x: this.x,
            y: this.y + this.height,
        }]
        graph.fill_polygon(points, red);
    }

    drawText() {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial'
        ctx.fillText(Math.floor(this.health), Math.floor(this.x + this.width / 3), Math.floor(this.y + this.height / 2));
    }
}

function handleEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        enemies[i].draw();

        if (enemies[i].x < 0) {
            gameOver = true;
        };
    }
    if (frame % enemiesInterval === 0) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize;
        enemies.push(new Enemy(verticalPosition));
        enemyPosition.push(verticalPosition);
        if (enemiesInterval > 120) enemiesInterval -= 100;
    }
}

function handleEnemiesText() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].drawText();
    }
}
// utilities

function handleGameStatus() {
    ctx.fillStyle = 'gold';
    ctx.font = '30px Arial';
    ctx.fillText(`Resources: ${numberOfResources}`, 20, 55);
    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Arial';
        ctx.fillText('GAME OVER', 135, 330);
    }
}
function animate() {
    graph.clearScreen(ctx);
    drawControlsBar();
    handleGameGrid();
    handleDefenders();
    handleEnemies();
    ctx.putImageData(graph.image_data, 0, 0);
    handleDefendersText();
    handleEnemiesText();
    handleGameStatus();
    frame++;
    if (!gameOver) requestAnimationFrame(animate);
}

animate();

function collision(first, second) {
    if (!(first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y)
    ) {
        return true;
    }
    return false;
}