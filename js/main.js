'use strict'

const MINE = '💣'
const FLAG = '🚩'

const gLevels = [{ SIZE: 4, MINES: 2 }, { SIZE: 8, MINES: 14 }, { SIZE: 12, MINES: 32 }]
var gLevel = gLevels[0]
const gGame = {}

var gBoard = []
var gGameInterval
var gGameStartTime


function onInit() {
    renderLevelButtons()
    resetGame()
    gBoard = buildBoard()
    renderBoard()
    printBoard()
}

function resetGame() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    gGameStartTime = Date.now()
    clearInterval(gGameInterval)
    gGameInterval = setInterval(() => { gGame.secsPassed = (Date.now() - gGameStartTime) / 1000 }, 1000)
    closeModal()
}

function buildBoard() {
    const board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    addMines(board)
    // board[2][2].isMine = board[1][0].isMine = true
    // board[2][2].isShown = board[2][0].isShown = true
    // board[2][2].isMarked = true
    setMinesNegsCount(board)
    return board
    // console.table(gBoard)
}

function setMinesNegsCount(board) {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            const minesCount = countNegs(board, i, j)
            board[i][j].minesAroundCount = minesCount
        }
    }
}

function renderBoard() {
    var strHTML = ''
    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j].isMarked ? FLAG : ''
            var strClassName = ''
            if (gBoard[i][j].isShown) {
                cell = gBoard[i][j].isMine ? MINE : gBoard[i][j].minesAroundCount
                strClassName = 'shown'
            }
            strHTML += `<td class="${strClassName}" onClick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(event, this, ${i}, ${j})"><span class='cell-${i}-${j}'>${cell}</span></td>`
        }
        strHTML += '</tr>'
    }
    document.querySelector('.board').innerHTML = strHTML
}

//* for work
function printBoard() {
    const board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = gBoard[i][j].isMine ? MINE : gBoard[i][j].minesAroundCount
        }
    }
    console.table(board)
}
function printMarksBoard() {
    const board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = gBoard[i][j].isMarked ? FLAG : ''
        }
    }
    console.table(board)
}

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return

    const boardCell = gBoard[i][j]
    if (boardCell.isMarked) return
    if (boardCell.isShown) return

    boardCell.isShown = true
    elCell.classList.add('shown')
    gGame.shownCount++
    if (boardCell.isMine) {
        showMines()
        gGame.isOn = false
        document.querySelector('.msg').innerText = 'You Lose :('
        openModal()
        return
    }//*************** */

    if (boardCell.minesAroundCount === 0 && !boardCell.isMine) {
        expandShown(gBoard, elCell, i, j)
    }

    // renderBoard()
    const cellValue = boardCell.isMine ? MINE : boardCell.minesAroundCount
    renderCell({ i, j }, cellValue)
    if (checkGameOver()) {
        gGame.isOn = false
        document.querySelector('.msg').innerText = 'You Win!'
        openModal()
    }
    // console.log('gGame.isOn:	', gGame.isOn)
    // printBoard()
}

function onCellMarked(event, elCell, i, j) {
    // console.log('event:	', event)
    event.preventDefault()
    if (!gGame.isOn) return
    const boardCell = gBoard[i][j]
    if (boardCell.isShown) return
    // boardCell.isMarked = !boardCell.isMarked
    if (boardCell.isMarked) {
        boardCell.isMarked = false
        gGame.markedCount--
    }
    else {
        boardCell.isMarked = true
        gGame.markedCount++
    }
    renderBoard()
    if (checkGameOver()) gGame.isOn = false
 
    // printMarksBoard()
}

function checkGameOver() {
    return (gGame.markedCount === gLevel.MINES && gGame.shownCount === gLevel.SIZE ** 2 - gLevel.MINES)
}

function expandShown(board, elCell, i, j) {
    negsLoop((cell) => {
        if (cell.isShown || cell.isMarked) return
        cell.isShown = true
        gGame.shownCount++
    }, gBoard, i, j)
    renderBoard()
}

function renderCell(location, value) {
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    elCell.innerHTML = value
}

function addMines(board) {
    for (var i = 0; i < gLevel.MINES; i++) {
        const randLocation = getRandomEmptyCell(board)
        const cell = board[randLocation.i][randLocation.j]
        cell.isMine = true
    }
}

function showMines() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isMine) renderCell({ i, j }, MINE)
        }
    }
}

function renderLevelButtons() {
    var strHTML = ''
    for (var i = 0; i < gLevels.length; i++) {
        strHTML += `<button onclick="changeLevel(${i})">${gLevels[i].SIZE}</button>`
    }
    document.querySelector('.levels').innerHTML = strHTML
}

function changeLevel(i) {
    gLevel = gLevels[i]
    onInit()
}