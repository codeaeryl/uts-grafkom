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

// utilities
function animate() {
    graph.clearScreen(ctx);
    drawControlsBar();
    handleGameGrid();
    ctx.putImageData(graph.image_data, 0, 0);
    requestAnimationFrame(animate);
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