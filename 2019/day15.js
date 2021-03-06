// day15.js
import {assert} from './util.js'
import {runProgram} from './intcode.js'
import {Bitmap} from './bitmap.js'
// Thank you Brian Grinstead https://github.com/bgrins/javascript-astar
import AStar from '../javascript-astar/astar.js'

(() => {
    var graph = new AStar.Graph([
        [1,1,1,1],
        [0,1,1,0],
        [0,0,1,1]
    ]);
    var start = graph.grid[0][0];
    var end = graph.grid[1][2];
    var result = AStar.astar.search(graph, start, end);
    assert(3 === result.length)

    graph = new AStar.Graph([
        [0,1,1,0],
        [0,1,1,0],
        [1,1,0,0],
        [0,0,0,0]
    ]);
    start = graph.grid[1][1];
    end = graph.grid[0][2];
    result = AStar.astar.search(graph, start, end);
    assert(2 === result.length) 
})();

/*
--- Day 15: Oxygen System ---
Out here in deep space, many things can go wrong. Fortunately, many of those things have indicator lights. Unfortunately, one of those lights is lit: the oxygen system for part of the ship has failed!

According to the readouts, the oxygen system must have failed days ago after a rupture in oxygen tank two; that section of the ship was automatically sealed once oxygen levels went dangerously low. A single remotely-operated repair droid is your only option for fixing the oxygen system.

The Elves' care package included an Intcode program (your puzzle input) that you can use to remotely control the repair droid. By running that program, you can direct the repair droid to the oxygen system and fix the problem.

The remote control program executes the following steps in a loop forever:

- Accept a movement command via an input instruction.
- Send the movement command to the repair droid.
- Wait for the repair droid to finish the movement operation.
- Report on the status of the repair droid via an output instruction.

Only four movement commands are understood: north (1), south (2), west (3), and east (4). Any other command is invalid. The movements differ in direction, but not in distance: in a long enough east-west hallway, a series of commands like 4,4,4,4,3,3,3,3 would leave the repair droid back where it started.

*/
const NORTH = 1
const SOUTH = 2
const WEST = 3
const EAST = 4

/*

The repair droid can reply with any of the following status codes:

0: The repair droid hit a wall. Its position has not changed.
1: The repair droid has moved one step in the requested direction.
2: The repair droid has moved one step in the requested direction; its new position is the location of the oxygen system.
*/
const STATUS_WALL = 0
const STATUS_OK = 1
const STATUS_OXYGEN = 2;
/*

You don't know anything about the area around the repair droid, but you can figure it out by watching the status codes.

For example, we can draw the area using D for the droid, # for walls, . for locations the droid can traverse, and empty space for unexplored locations. Then, the initial state looks like this:

      
      
   D  
      
      
To make the droid go north, send it 1. If it replies with 0, you know that location is a wall and that the droid didn't move:

      
   #  
   D  
      
      
To move east, send 4; a reply of 1 means the movement was successful:

      
   #  
   .D 
      
      
Then, perhaps attempts to move north (1), south (2), and east (4) are all met with replies of 0:

      
   ## 
   .D#
    # 
      
Now, you know the repair droid is in a dead end. Backtrack with 3 (which you already know will get a reply of 1 because you already know that location is open):

      
   ## 
   D.#
    # 
      
Then, perhaps west (3) gets a reply of 0, south (2) gets a reply of 1, south again (2) gets a reply of 0, and then west (3) gets a reply of 2:

      
   ## 
  #..#
  D.# 
   #  
Now, because of the reply of 2, you know you've found the oxygen system! In this example, it was only 2 moves away from the repair droid's starting position.

What is the fewest number of movement commands required to move the repair droid from its starting position to the location of the oxygen system?

*/

const puzzleInput = [3,1033,1008,1033,1,1032,1005,1032,31,1008,1033,2,1032,1005,1032,58,1008,1033,3,1032,1005,1032,81,1008,1033,4,1032,1005,1032,104,99,102,1,1034,1039,101,0,1036,1041,1001,1035,-1,1040,1008,1038,0,1043,102,-1,1043,1032,1,1037,1032,1042,1105,1,124,1001,1034,0,1039,102,1,1036,1041,1001,1035,1,1040,1008,1038,0,1043,1,1037,1038,1042,1106,0,124,1001,1034,-1,1039,1008,1036,0,1041,102,1,1035,1040,1002,1038,1,1043,101,0,1037,1042,1106,0,124,1001,1034,1,1039,1008,1036,0,1041,1002,1035,1,1040,102,1,1038,1043,101,0,1037,1042,1006,1039,217,1006,1040,217,1008,1039,40,1032,1005,1032,217,1008,1040,40,1032,1005,1032,217,1008,1039,37,1032,1006,1032,165,1008,1040,39,1032,1006,1032,165,1102,2,1,1044,1106,0,224,2,1041,1043,1032,1006,1032,179,1101,0,1,1044,1105,1,224,1,1041,1043,1032,1006,1032,217,1,1042,1043,1032,1001,1032,-1,1032,1002,1032,39,1032,1,1032,1039,1032,101,-1,1032,1032,101,252,1032,211,1007,0,74,1044,1106,0,224,1102,0,1,1044,1106,0,224,1006,1044,247,1002,1039,1,1034,102,1,1040,1035,1002,1041,1,1036,102,1,1043,1038,1001,1042,0,1037,4,1044,1106,0,0,4,35,96,8,87,44,67,40,80,25,91,53,86,23,96,7,76,76,10,30,90,46,47,40,93,75,3,17,1,19,89,7,92,47,95,3,92,39,72,69,6,18,86,94,19,82,98,9,7,91,42,86,29,83,65,43,91,71,92,16,96,82,5,81,6,92,93,76,71,17,91,91,73,64,33,27,89,4,99,81,80,6,57,87,9,42,99,97,13,42,81,82,72,68,35,93,2,99,6,6,94,2,39,39,86,43,97,77,86,21,56,75,61,91,82,56,94,32,47,90,33,72,93,13,87,12,42,68,99,71,34,97,79,87,99,79,25,42,95,97,51,93,80,33,71,68,89,50,49,78,77,24,93,70,13,11,56,29,18,77,77,94,60,80,75,84,42,87,90,58,84,27,78,3,80,70,85,79,4,36,94,65,79,93,94,13,97,75,49,92,15,84,5,85,35,67,96,87,64,32,83,97,20,89,64,18,93,32,46,91,57,53,75,56,7,56,92,99,36,22,93,19,25,29,48,86,94,68,18,95,79,87,97,55,75,44,65,82,99,31,94,42,53,81,72,85,70,93,47,40,77,60,85,87,11,60,98,25,90,88,93,93,85,64,43,88,96,36,83,14,98,40,48,11,18,80,97,49,23,2,91,85,50,88,94,41,75,99,84,15,45,9,81,83,96,51,56,58,76,72,50,94,59,76,87,10,25,88,73,99,20,95,46,93,88,2,50,89,86,26,18,85,72,85,75,66,83,25,97,96,25,94,14,34,94,89,57,88,78,17,92,59,40,29,84,87,55,61,81,9,82,93,17,33,81,81,58,43,91,68,86,80,61,83,23,46,78,60,14,94,79,28,91,57,79,83,48,92,5,49,97,81,56,53,84,42,58,93,20,71,29,29,89,88,34,31,87,92,78,62,78,72,93,3,54,97,82,38,32,89,86,88,38,19,84,51,99,60,90,95,14,78,11,82,89,12,87,98,70,79,33,76,44,97,79,33,19,34,83,58,4,89,21,88,78,46,78,76,66,61,92,91,38,86,27,61,86,46,52,97,44,80,89,53,55,47,83,34,44,97,37,41,92,28,70,95,82,91,76,8,99,2,80,1,66,96,71,94,1,44,89,29,13,99,35,80,89,31,91,19,77,46,85,77,93,61,31,62,14,92,82,73,94,86,20,31,94,72,73,44,61,91,79,40,88,69,85,6,83,96,49,12,77,39,83,91,24,70,13,81,57,39,88,38,23,80,43,92,67,46,87,25,80,93,82,68,98,93,63,85,29,18,78,94,27,89,85,20,63,89,93,96,99,50,71,97,15,28,53,78,85,78,82,64,67,14,94,47,96,65,58,81,20,91,36,82,55,11,85,87,59,84,6,67,87,69,88,81,68,38,84,52,33,79,97,69,89,89,34,96,18,78,67,87,36,93,57,77,77,21,47,99,27,26,79,7,88,37,90,33,25,96,66,83,24,30,82,84,16,82,85,15,55,92,20,80,92,38,20,34,87,67,11,84,28,42,93,26,54,89,85,78,82,60,14,9,76,85,10,80,80,50,85,29,86,20,61,81,80,51,32,88,91,92,34,56,79,58,76,41,47,89,24,40,90,85,88,30,48,91,42,2,91,95,98,60,79,40,86,61,79,81,23,91,91,12,21,78,54,75,61,11,79,89,73,84,13,95,81,6,52,92,37,76,65,82,84,87,40,94,70,78,71,83,46,94,2,79,57,80,35,99,21,83,81,93,64,81,78,99,57,87,49,87,41,92,83,82,58,92,0,0,21,21,1,10,1,0,0,0,0,0,0]

const WALL = '#'
const OPEN_SPACE = '.'
const DROID = 'D'
const OXYGEN = 'o'
const map = new Bitmap()
let pos = {x:0,y:0}
map.setPt(pos, {pixel:DROID, lastPixel: OPEN_SPACE, count:0})
let testPos = {}
let oxyPos
let move = 0

/** 
 * Some basic path finding for mazes.
 */
function onMove() {
    function pointAdd(a, b) {
        return {x:a.x + b.x, y:a.y + b.y}
    }
    const moves = [
        {dir:NORTH, to:pointAdd(pos, {x:0, y:-1})}, 
        {dir:EAST, to:pointAdd(pos, {x:1, y:0})},
        {dir:SOUTH, to:pointAdd(pos, {x:0, y:1})},
        {dir:WEST, to:pointAdd(pos, {x:-1, y:0})}
    ].map((v) =>  ({...v, value:map.getPt(v.to) || {pixel:' ', count:0}}))
    .filter((v) => v.value.pixel !== '#')
    .sort((l,r) => l.value.count - r.value.count)
    
    testPos = moves[0].to
    return moves[0].dir
}

function moveDroid(from, to, lastPixel) {
    let x = map.getPt(from)
    x.pixel = x.lastPixel
    x.count++

    x = map.getPt(to) || {pixel:DROID, lastPixel, count:0}
    x.pixel = DROID
    x.count++
    map.setPt(to, x)
}

function onMoveResult(status) {
    if (status === STATUS_WALL) {
        map.setPt(testPos, {pixel:WALL, lastPixel: WALL, count:0})
    } else if (status === STATUS_OK) {
        moveDroid(pos, testPos, OPEN_SPACE)
        pos = testPos
    } else {
        moveDroid(pos, testPos, OXYGEN)
        pos = testPos
        oxyPos = {...testPos}
        console.log(`Found Oxygen at ${oxyPos.x}, ${oxyPos.y}`)
    }
    move++
    // Yes, Super Hack, should instead wait until all tiles visited and 
    // underlying counts of lastPixels doesn't change between moves.
    if (oxyPos && move > 8500) { 
        findDistance()
    }
}

function findDistance() {
    map.print()
    const {offset, grid} = bitmapToAStarGrid(map)
    printGrid(grid)

    var graph = new AStar.Graph(grid);
    var start = graph.grid[0 - offset.y][0 - offset.x];
    var end = graph.grid[oxyPos.y - offset.y][oxyPos.x - offset.x];
    var astar = AStar.astar.search(graph, start, end);
    astar.forEach((pt) => grid[pt.y][pt.x] = 2)
    printGrid(grid)

    console.log(`Part One Answer ${astar.length}`)
    assert(294 === astar.length, 'Part One Not 294 :(')
    part2()
}

function printGrid(grid) {
    for (let r = 0 ; r < grid.length ; r++) { 
        console.log(grid[r].map((v) => v ? (v === 1 ? '1' : '@') : ' ').join(''))
    }
}

function part2() {
    // 0 => Wall
    // 1 => unoxygenated room
    // 2 => oxygenated
    const {offset, grid} = bitmapToAStarGrid(map)
    let summary
    let startPos = {y:[oxyPos.y - offset.y], x:[oxyPos.x - offset.x]}
    grid[startPos.y][startPos.x] = 2

    function updateSummary() {
        summary = { 0: 0, 1: 0, 2: 0 }
        for (let r = 0 ; r < grid.length ; r++) { 
            for (let c = 0 ; c < grid[r].length ; c++) {
                summary[grid[r][c]] ++
            }
        }
    }
    function canHaveOxy(pos) {
        return grid[pos[0]][[pos[1]]] === 1
    }
    function oxygenate() {
        let newOxyCells = []
        for (let r = 0 ; r < grid.length ; r++) { 
            for (let c = 0 ; c < grid[r].length ; c++) {
                if (grid[r][c] === 2) {
                    newOxyCells = [
                        ...newOxyCells, 
                        ...[[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].filter(canHaveOxy)
                    ]
                }
            }
        }
        newOxyCells.forEach((pos) => grid[pos[0]][pos[1]] = 2)
    }
    let minute = 0
    updateSummary()
    while (summary[1]) {
        oxygenate()
        minute++
        updateSummary()
    }
    // 1st Try : 385  <-- TOO LOW
    // 2nd Try : 388  Had start coord backwards
    console.log(`Part Two Answer ${minute}`)
    assert(388 === minute, 'Wrong Answer')
    process.exit()
}

runProgram({
    memory: puzzleInput,
    input: onMove,
    output: onMoveResult
})

function bitmapToAStarGrid(map) {
    const grid = []
    let offset
    map.visit((x, y, v) => {
        if (!offset) {
            offset = {x, y}
        }
        let row = grid[y - offset.y]
        if (!row) {
            row = []
            grid.push(row)
        }
        v = v || {lastPixel: WALL}
        row.push((v && v.lastPixel !== WALL) ? 1 : 0)
    })
    return {offset, grid}
}
