'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GAMER = 'GAMER'
const GLUE = 'GLUE'

const GAMER_IMG = '<img src="img/TEEMO2.png">'
const BALL_IMG = '<img src="img/mushroom.png">'
const GLUE_IMG = '<img src="img/poison.png">'



// Model:
var gBoard
var gGamerPos
var gBallCount
var gIsGlued

var gBallInterval
var gGlueInterval

function onInitGame() {
    document.querySelector('.restart-btn').hidden = true
    play()
    
    gIsGlued = false
    gGamerPos = { i: 2, j: 9 }
    gBallCount = 0
    gBoard = buildBoard()
    renderBoard(gBoard)
    

    gBallInterval = setInterval(addBall, 5000)
    gGlueInterval = setInterval(addGlue, 5000)
}

function buildBoard() {
    // DONE: Create the Matrix 10 * 12 
    const board = createMat(10, 12)
    // DONE: Put FLOOR everywhere and WALL at edges
    const lastRowIdx = board.length - 1
    const lastColumnIdx = board[0].length - 1

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = { type: FLOOR, gameElement: null }

            if (i === 0 || j === 0 ||
                i === lastRowIdx || j === lastColumnIdx) {
                board[i][j].type = WALL
            }
        }
    }

    const midRowIdx = Math.ceil(lastRowIdx / 2)
    const midColumnIdx = Math.floor(lastColumnIdx / 2)

    board[0][midColumnIdx].type = FLOOR
    board[lastRowIdx][midColumnIdx].type = FLOOR

    board[midRowIdx][0].type = FLOOR
    board[midRowIdx][lastColumnIdx].type = FLOOR

    // DONE: Place the gamer and two balls
    board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
    board[5][5].gameElement = BALL
    board[7][2].gameElement = BALL
    updateBallCount(2)
    updateNegBallCount(gGamerPos, board)
    return board
}

// Render the board to an HTML table
function renderBoard(board) {

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            // console.log('currCell:', currCell)
            var cellClass = getClassName({ i: i, j: j })

            if (currCell.type === FLOOR) cellClass += ' floor'
            else if (currCell.type === WALL) cellClass += ' wall'

            strHTML += `\t<td class="cell ${cellClass}"  onclick="moveTo(${i},${j})" >`

            if (currCell.gameElement === GAMER) {
                strHTML += GAMER_IMG
            } else if (currCell.gameElement === BALL) {
                strHTML += BALL_IMG
            }

            strHTML += '\t</td>'
        }
        strHTML += '</tr>'
    }

    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}

// Move the player to a specific location
function moveTo(i, j) {
    if (gIsGlued) return

    const lastRowIDx = gBoard.length - 1
    const lastColumnIdx = gBoard[0].length - 1

    if (j < 0) j = lastColumnIdx
    if (j > lastColumnIdx) j = 0
    if (i < 0) i = lastRowIDx
    if (i > lastRowIDx) i = 0

    // Calculate distance to make sure we are moving to a neighbor cell
    const iAbsDiff = Math.abs(i - gGamerPos.i)
    const jAbsDiff = Math.abs(j - gGamerPos.j)

    // If the clicked Cell is one of the four allowed
    if (iAbsDiff + jAbsDiff === 1 || iAbsDiff === lastRowIDx || jAbsDiff === lastColumnIdx) {
        const targetCell = gBoard[i][j]

        if (targetCell.type === WALL) return
        if (targetCell.gameElement === BALL) {
            updateBallCount(-1)

            checkVictory()
        } else if (targetCell.gameElement === GLUE) {
            gIsGlued = true

            setTimeout(() => {
                gIsGlued = false
            }, 3000)
        }

        //move the gamer
        gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
        renderCell(gGamerPos, '')

        gGamerPos = { i: i, j: j }
        gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER
        renderCell(gGamerPos, GAMER_IMG)

        //Check for neighbours
        updateNegBallCount(gGamerPos, gBoard)

    } else console.log('TOO FAR', iAbsDiff, jAbsDiff)

}



// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
    const cellSelector = '.' + getClassName(location)
    const elCell = document.querySelector(cellSelector)
    elCell.innerHTML = value
}

// Move the player by keyboard arrows
function onKey(ev) {
    const i = gGamerPos.i
    const j = gGamerPos.j

    switch (ev.key) {
        case 'ArrowLeft':
            moveTo(i, j - 1)
            break
        case 'ArrowRight':
            moveTo(i, j + 1)
            break
        case 'ArrowUp':
            moveTo(i - 1, j)
            break
        case 'ArrowDown':
            moveTo(i + 1, j)
            break
    }
}

// Returns the class name for a specific cell
function getClassName(location) {
    const cellClass = `cell-${location.i}-${location.j}`
    return cellClass
}

function addBall() {
    const emptyCell = getEmptyCell(gBoard)
    if (!emptyCell) return
    gBoard[emptyCell.i][emptyCell.j].gameElement = BALL
    renderCell(emptyCell, BALL_IMG)
    updateNegBallCount(gGamerPos, gBoard)
    updateBallCount(1)
}

function addGlue() {
    const emptyCell = getEmptyCell(gBoard)
    if (!emptyCell) return
    gBoard[emptyCell.i][emptyCell.j].gameElement = GLUE
    renderCell(emptyCell, GLUE_IMG)

    setTimeout(() => {
        if (gIsGlued) return
        gBoard[emptyCell.i][emptyCell.j].gameElement = null
        renderCell(emptyCell, '')
    }, 3000)
}

function getEmptyCell(board) {
    const emptyCells = []

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            const currCell = board[i][j]
            if (currCell.type === FLOOR && currCell.gameElement === null)
                emptyCells.push({ i: i, j: j })

        }

    }

    if (!emptyCells.length) return null

    const randomIdx = getRandomInt(0, emptyCells.length - 1)
    return emptyCells[randomIdx]

}


function checkVictory() {
    if (gBallCount > 0) return

    clearInterval(gBallInterval)
    clearInterval(gGlueInterval)
    gIsGlued = true
    document.querySelector('.restart-btn').hidden = false
}

function updateBallCount(diff) {
    gBallCount += diff
    document.querySelector('h2 span').innerText = gBallCount
}


function updateNegBallCount(gamerPos, board) {
    const negBallCount = countNegBalls(gamerPos.i, gamerPos.j, board)
    document.querySelector('h3 span').innerText = negBallCount
}

function countNegBalls(cellI, cellJ, board) {
    var negBallCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === cellI && j === cellJ) continue
            if (board[i][j].gameElement === BALL) negBallCount++

        }
    }
    return negBallCount
}

function play() {
    var audio = new Audio('TEEMO-AUDIO.mp3');
    audio.muted = true
    audio.play();
}