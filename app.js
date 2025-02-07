const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = 1200;
const HEIGHT = 800;

const ROW_COUNT = 50;
const COL_COUNT = 50;

const CELL_WIDTH = WIDTH / ROW_COUNT;
const CELL_HEIGHT = HEIGHT / COL_COUNT;

const EMPTY_COLOR = "#232323";
const START_COLOR = "#0f0";
const END_COLOR = "#f00";
const BORDER_COLOR = "#000";
const SEARCHED_COLOR = "#aaa";
const HEAD_COLOR = "#fff";
const OUTPUT_PATH_COLOR = "pink";
const LINE_COLOR = "#000";

canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.backgroundColor = "#232323";
canvas.style.border = "1px solid #232323";

let startCell;
let endCell;
let borders = [];

function drawLines() {
    // horizontal lines
    for(let i = 0; i <= ROW_COUNT; i++) {
        const posY = i * CELL_HEIGHT;
        ctx.strokeStyle = LINE_COLOR;
        ctx.beginPath();
        ctx.moveTo(0, posY);
        ctx.lineTo(WIDTH, posY);
        ctx.stroke();
    }

    for(let i = 0; i <= COL_COUNT; i++) {
        const posX = i * CELL_WIDTH;
        ctx.strokeStyle = LINE_COLOR;
        ctx.beginPath();
        ctx.moveTo(posX, 0);
        ctx.lineTo(posX, HEIGHT);
        ctx.stroke();
    }
}

let map = []

function drawMap() {
    for(let row_index = 0; row_index < ROW_COUNT; row_index++) {
        for(let col_index = 0; col_index< COL_COUNT; col_index++) {
            const cell = map[row_index][col_index];
            ctx.beginPath();
            if(cell.type == 0) {
                ctx.fillStyle = START_COLOR;
            } else if (cell.type == 1) {
                ctx.fillStyle = END_COLOR;
            } else if (cell.type == -1) {
                ctx.fillStyle = EMPTY_COLOR;
            } else if (cell.type == -2) {
                ctx.fillStyle = BORDER_COLOR;
            }
            ctx.fillRect(col_index * CELL_WIDTH, row_index * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT)
        }
    }

    drawLines();
}

function createMap() {
    for(let i = 0; i < ROW_COUNT; i++) {
        map.push([]);
        for(let j = 0; j < COL_COUNT; j++) {
            map[i].push({type: -1, row: i, col: j});
        }
    }


    for(let i = 0; i < 2; i++) {
        const randomRow = Math.floor(Math.random() * ROW_COUNT);
        const randomCol = Math.floor(Math.random() * COL_COUNT);

        ctx.beginPath();
        if(i % 2 == 0) {
            ctx.fillStyle = "#f00";
            const cell = {type: 0, row: randomRow, col: randomCol};
            map[randomRow][randomCol] = cell;
            startCell = cell;
        } else {
            ctx.fillStyle = "#0f0";
            const cell = {type: 1, row: randomRow, col: randomCol};
            map[randomRow][randomCol] = cell;
            endCell = cell;
        }

        ctx.fillRect(randomRow * CELL_WIDTH , randomCol * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    }

    createRandomBorders();
    drawMap();
}

createMap();

function createRandomBorders(count = ROW_COUNT * COL_COUNT / 4) {
    for(let i = 0; i < count; i++) {
        let isBorderOK = false;
        while(!isBorderOK) {
            const randomRow = Math.floor(Math.random() * ROW_COUNT);
            const randomCol = Math.floor(Math.random() * COL_COUNT);

            const border = {
                type: -2,
                row: randomRow,
                col: randomCol,
            };

            if(!borders.includes(border) && map[randomRow][randomCol].type != 1 && map[randomRow][randomCol].type != 0) {
                isBorderOK = true;

                borders.push(border);
                map[randomRow][randomCol] = border;
                break;
            }

            isBorderOK = false;
        }
    }
}

function changeType(e) {
    const posX = e.offsetX;
    const posY = e.offsetY;

    const rowIndex = Math.floor(posY / CELL_HEIGHT);
    const colIndex = Math.floor(posX / CELL_WIDTH);

    const cell = map[rowIndex][colIndex];

    if(cell.type == -1) {
        cell.type = -2;
    } else if (cell.type == -2) {
        cell.type = -1;
    }

    drawMap();
}

canvas.addEventListener("click", changeType);

// implementing algorithm

function findHeuristic(cell, stepCount) {
    const endDistanceX = Math.abs(cell.col - endCell.col);
    const endDistanceY = Math.abs(cell.row - endCell.row);

    return endDistanceX + endDistanceY; // + stepCount;
}

function findPossibilities(cell, stepCount) {
    let neighbors = []
    for(let i = 0; i < 4; i++) {
        const power = i % 2;
        let neighborCell = undefined;
        if(i < 2) {
            try{
                neighborCell = map[cell.row + (-1) ** power][cell.col]
            } catch (Error) {
            }
        } else {
            try {
                neighborCell = map[cell.row][cell.col + (-1) ** power];
            } catch (Error) {
            }
        }

        if(neighborCell && neighborCell.type != -2) {
            neighborCell.heuristics = findHeuristic(neighborCell, stepCount);

            neighbors.push(neighborCell);
        }
    }

    return neighbors;
}

function findLeastHeuristicPath(paths) {
    return paths.sort((a, b) => a.heuristics - b.heuristics)[0]
}

async function findPath() {
    let paths = [{stepCount: 1, heuristics: false, cells: [startCell]}];
    let controlledCells = [];
    let isFound = false;
    let count = 0;
    let outputPath;
    while (!isFound) {
        let path = findLeastHeuristicPath(paths);
        console.log(paths, path);
        //paths.forEach((path, index) => {
            const neighbors = findPossibilities(path.cells[path.stepCount - 1], path.stepCount);
            neighbors.forEach((neighbor) => {
                if(neighbor.row == endCell.row && neighbor.col == endCell.col) {
                    isFound = true;
                    outputPath = path;
                } else {

                if(!controlledCells.includes(neighbor)) {
                    const newPath = {
                        stepCount: path.stepCount + 1,
                        cells: [...path.cells, neighbor]
                    }

                    // to do list, activation buttons and with stepCount & withoutStepCount

                    newPath.heuristics = newPath.cells[newPath.cells.length - 1].heuristics + newPath.stepCount; // without stepCount it is more efficient but can the road not be fastest
                    paths.push(newPath);
                    controlledCells.push(neighbor);

                }
                }
                //});
                //
        });

        if(!isFound) {
            for(let i = 0; i < paths.length; i++) {
                if(paths[i] == path) {
                    paths.splice(i, 1);
                    break;
                }
            }
        }

        drawPaths(paths);
        if(isFound) {
            drawOutputPath(outputPath);
        }

        await sleep(10);
    }
}

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function drawOutputPath(path) {
    path.cells.forEach((cell, index) => {
        ctx.beginPath();

        if(index > 0 && index != path.stepCount - 1) {
            ctx.fillStyle = OUTPUT_PATH_COLOR;
        }

        ctx.fillRect(cell.col * CELL_WIDTH, cell.row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
    });
}

function drawPaths(paths) {
    paths.forEach((path) => {
        path.cells.forEach((cell, index) => {
            if(index != path.stepCount - 1) {
                ctx.fillStyle = SEARCHED_COLOR;
            } else if(index > 0){
                ctx.fillStyle = HEAD_COLOR;
            }

            ctx.beginPath();
            ctx.fillRect(cell.col * CELL_WIDTH, cell.row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

            if (index == path.stepCount - 1) {
                ctx.font = "24pt #000";
                ctx.fillStyle = "#000";
                ctx.fillText(path.heuristics, cell.col * CELL_WIDTH + CELL_WIDTH / 2 - 6, cell.row * CELL_HEIGHT + CELL_HEIGHT / 2);
            }
        });
    });

    ctx.fillStyle = START_COLOR;
    ctx.fillRect(startCell.col * CELL_WIDTH, startCell.row * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
}

findPath();





