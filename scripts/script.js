import GrafLib from "./GrafLib.js";

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// global variable
const cellSize = 100;
const cellGap = 3;
const winningScore = 50;
const amounts = [30, 40, 50];
const defenderCost = 100;
const defenderInterval = 100;
const resourceInterval = 500;
const enemiesResourceGain = 0.1;
const enemiesMinInterval = 150;
const enemiesSpeedup = 60;
const enemiesDamage = 0.2;
const startingEnemiesInterval = 600;
const startingResources = 300

let numberOfResources = startingResources;
let enemiesInterval = startingEnemiesInterval;
let frame = 0;
let gameOver = false;
let score = 0;
let canvasPosition = canvas.getBoundingClientRect();

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPosition = [];
const projectiles = [];
const resources = [];

// colors
const black = { r: 0, g: 0, b: 0, a: 255 };
const blue = { r: 0, g: 0, b: 255, a: 255 };
const red = { r: 255, g: 0, b: 0, a: 255 };
const yellow = { r: 255, g: 255, b: 0, a: 255 };

let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const graph = new GrafLib(canvas.width, canvas.height, imgData, cellSize);

// mouse
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1
}

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', (e) => {
    mouse.x = undefined;
    mouse.y = undefined;
});

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
class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
    }

    update() {
        this.x += this.speed;
    }

    draw() {
        graph.fill_circle_buffer({ x: this.x, y: this.y }, this.width, black);
    }
}
function handleProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();

        for (let j = 0; j < enemies.length; j++) {
            if (projectiles[i] && enemies[j] && collision(enemies[j], projectiles[i])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }
        if (projectiles[i] && projectiles[i].x > canvas.width) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

// defenders
class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.health = 100;
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
        graph.fill_polygon_buffer(points, blue);
    }

    drawText() {
        ctx.font = '30px Orbitron'
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }

    update() {
        if (this.shooting) {
            this.timer++;

            if (this.timer % defenderInterval === 0) {
                projectiles.push(new Projectile(this.x + 0.7 * cellSize, this.y + 0.5 * cellSize))
            }
        } else {
            this.timer = 0;
        }
    }
}

canvas.addEventListener('click', () => {
    const gridPositionX = mouse.x - mouse.x % cellSize + cellGap;
    const gridPositionY = mouse.y - mouse.y % cellSize + cellGap;

    if (gridPositionY < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
            return;
    }
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }
});

function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();

        if (enemyPosition.indexOf(defenders[i].y) != -1) {
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++) {
            enemies[j].movement = enemies[j].speed;
            if (defenders[i] && enemies[j] && collision(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= enemiesDamage;
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
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = 0.6;
        this.movement = this.speed;
        this.health = 100;
        this.maxHealth = this.health;
        this.damage = 0.2;
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
        graph.fill_polygon_buffer(points, red);
    }

    drawText() {
        ctx.font = '30px Orbitron'
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
    }
}

function handleEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        enemies[i].draw();

        if (enemies[i].x < 0) gameOver = true;
        if (enemies[i].health <= 0) {
            let gainedResources = enemies[i].maxHealth * enemiesResourceGain;
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPosition.indexOf(enemies[i].y);
            enemyPosition.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
        }
    }
    if (frame % enemiesInterval === 0 && score < winningScore) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
        enemies.push(new Enemy(verticalPosition));
        enemyPosition.push(verticalPosition);
        if (enemiesInterval > enemiesMinInterval)
            enemiesInterval -= enemiesSpeedup;
        if (enemiesInterval < enemiesMinInterval)
            enemiesInterval = enemiesMinInterval;
    }
}

function handleEnemiesText() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].drawText();
    }
}

// resource
class Resource {
    constructor() {
        this.x = Math.random() * (canvas.width - cellSize);
        this.y = Math.floor(Math.random() * 5 + 1) * cellSize + 25;
        this.width = cellSize * 0.6;
        this.height = cellSize * 0.6;
        this.amount = amounts[Math.floor(Math.random() * amounts.length)];
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
        graph.fill_polygon_buffer(points, yellow);
    }

    drawText() {
        ctx.font = '20px Orbitron'
        ctx.fillText(this.amount, this.x + 15, this.y + 25);
    }
}

function handleResources() {
    if (frame % resourceInterval === 0 && score < winningScore && enemies.length != 0) {
        resources.push(new Resource());
    }
    for (let i = 0; i < resources.length; i++) {
        resources[i].draw();

        if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
            numberOfResources += resources[i].amount;
            resources.splice(i, 1);
            i--;
        }
    }
}

function handleResourcesText() {
    for (let i = 0; i < resources.length; i++) {
        resources[i].drawText();
    }
}

// utilities
function handleGameStatus() {
    ctx.font = '30px Orbitron';
    ctx.fillText(`Score: ${score}/${winningScore}`, 20, 40);
    ctx.fillText(`Resources: ${numberOfResources}`, 20, 80);

    if (gameOver) {
        ctx.font = '90px Orbitron';
        ctx.fillText('GAME OVER', 135, 330);
        ctx.font = '30px Orbitron';
        ctx.fillText('Press Space to Restart', 135, 380);
    }
    if (score > winningScore && enemies.length === 0) {
        ctx.font = '60px Orbitron';
        ctx.fillText('LEVEL COMPLETE', 130, 300);
        ctx.font = '30px Orbitron';
        ctx.fillText(`You win with ${score} points!`, 134, 340);
        ctx.fillText('Press Space to Restart', 135, 380);
    }
}

function animate() {
    graph.clearScreen(ctx);
    drawControlsBar();
    handleDefenders();
    handleEnemies();
    handleResources();
    handleProjectiles();
    handleGameGrid();
    ctx.putImageData(graph.image_data, 0, 0);
    handleDefendersText();
    handleEnemiesText();
    handleResourcesText();
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

window.addEventListener('resize', () => {
    canvasPosition = canvas.getBoundingClientRect();
})

window.addEventListener('keypress', (e) => {
    if ((gameOver || (score > winningScore && enemies.length === 0))
        && e.code === 'Space') {
        const isGameOver = gameOver;
        numberOfResources = startingResources;
        enemiesInterval = startingEnemiesInterval;
        frame = 0;
        gameOver = false;
        score = 0;
        defenders.splice(0, defenders.length);
        enemies.splice(0, enemies.length);
        enemyPosition.splice(0, enemyPosition.length);
        projectiles.splice(0, projectiles.length);
        resources.splice(0, resources.length);
        if (isGameOver) {
            animate();
        }
    }
})