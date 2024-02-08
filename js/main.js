'use strict'

const MINE = '💣'
const FLAG = '🚩'
const LIFE_ON = '💖'
const LIFE_OFF = '🤍'
const HINT = '💡'

const gLevels = [{ SIZE: 4, MINES: 2 }, { SIZE: 8, MINES: 14 }, { SIZE: 12, MINES: 32 }]
var gLevel = gLevels[0]
const gGame = {}
const gMaxLives = 3
const gMaxHints = 3

var gBoard = []
var gGameInterval
var gGameStartTime
var gIsHint = false


function onInit() {
    renderLevelButtons()
    gBoard = buildBoard()
    renderBoard()
    resetGame()
    renderLives()
    renderHintIcons()
    renderMinesLeft()
    printBoard()
    closeModal()
    clearInterval(gGameInterval)
    gGameStartTime = null
    gIsHint = false
    document.body.classList.remove('win')
    document.body.classList.remove('lose')
}

function resetGame() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
    gGame.lives = gMaxLives
    gGame.hints = gMaxHints
    renderTimer()
    renderLlama(LLAMA_IMG)
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
    return board
}

function setMinesNegsCount(board) {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            const minesCount = countNegs(board, i, j)
            board[i][j].minesAroundCount = minesCount
        }
    }
}

function onCellClicked(elCell, i, j) {
    if (!gGameStartTime) {
        addMines(gBoard, { i, j })
        setMinesNegsCount(gBoard)
        gGameStartTime = Date.now()
        gGameInterval = setInterval(() => {
            gGame.secsPassed = Math.floor((Date.now() - gGameStartTime) / 1000)
            renderTimer()
        }, 1000)
        // printBoard() //************************************************************************************************* */
    }
    if (!gGame.isOn) return

    if (gIsHint) {
        revealCell({ i, j })
        negsLoop(revealCell, gBoard, i, j)
        gIsHint = false
        return
    }

    const boardCell = gBoard[i][j]
    if (boardCell.isMarked) return
    if (boardCell.isShown) return


    if (boardCell.minesAroundCount === 0 && !boardCell.isMine) {
        expandShownRec(gBoard, { i, j })
    }
    else gGame.shownCount++


    boardCell.isShown = true
    elCell.classList.add('shown')
    if (boardCell.isMine) {
        gGame.lives--
        renderLives()
        renderMinesLeft()
        elCell.classList.add('exploded')
        playAudio('hit.mp3')
        if (gGame.lives === 0) {
            showMines()
            document.body.classList.add('lose')
            renderLlama(SAD_LLAMA_IMG)
            gGame.isOn = false
            clearInterval(gGameInterval)
            document.querySelector('.msg').innerText = 'You Lose :('
            setTimeout(openModal, 100)
            return
        }
    }


    const cellValue = boardCell.isMine ? MINE : boardCell.minesAroundCount
    renderCell({ i, j }, cellValue)
    if (checkGameOver()) {
        renderLlama(HAPPY_LLAMA_IMG)
        document.body.classList.add('win')
        playAudio('twinkles.mp3')
        gGame.isOn = false
        clearInterval(gGameInterval)
        document.querySelector('.msg').innerText = 'You Win!'
        setTimeout(openModal, 100)
    }
}

function onCellMarked(event, elCell, i, j) {
    event.preventDefault()
    if (!gGame.isOn) return
    const boardCell = gBoard[i][j]
    if (boardCell.isShown) return
    if (boardCell.isMarked) {
        boardCell.isMarked = false
        gGame.markedCount--
    }
    else {
        boardCell.isMarked = true
        gGame.markedCount++
    }

    renderBoard()
    renderMinesLeft()

    if (checkGameOver()) gGame.isOn = false

    // printMarksBoard()
}

function checkGameOver() {
    const livesUsed = gMaxLives - gGame.lives
    return (gGame.markedCount + livesUsed === gLevel.MINES &&
        gLevel.SIZE ** 2 === gGame.shownCount + gGame.markedCount)
}

// function expandShown(board, elCell, i, j) {
//     negsLoop((cell) => {
//         if (cell.isShown || cell.isMarked) return
//         cell.isShown = true
//         gGame.shownCount++
//     }, gBoard, i, j)
//     renderBoard()
// }

function expandShownRec(board, location) {
    if (board[location.i][location.j].isMarked) return
    if (board[location.i][location.j].isMine) return
    if (board[location.i][location.j].isShown) return
    if (!board[location.i][location.j].isShown) {
        gGame.shownCount++
        board[location.i][location.j].isShown = true
    }
    document.querySelector(`.cell-${location.i}-${location.j}`).classList.add('shown')
    renderCell(location, board[location.i][location.j].minesAroundCount)
    if (!board[location.i][location.j].minesAroundCount) {
        for (var i = location.i - 1; i <= location.i + 1; i++) {
            if (i < 0 || i >= board.length) continue
            for (var j = location.j - 1; j <= location.j + 1; j++) {
                if (i === location.i && j === location.j) continue
                if (j < 0 || j >= board[0].length) continue
                expandShownRec(board, { i, j })
            }
        }
    }
}

function addMines(board, excludeLocation) {
    for (var i = 0; i < gLevel.MINES; i++) {
        const randLocation = getRandomEmptyCell(board, excludeLocation)
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

function changeLevel(i) {
    gLevel = gLevels[i]
    onInit()
}

function onHintClicked(elSpan) {
    if (!gGameStartTime) return
    if (gIsHint) {
        gIsHint = false
        elSpan.innerText = HINT
        elSpan.classList.remove('pressed-hint')
        return
    }
    gIsHint = true
    gGame.hints--
    elSpan.classList.add('pressed-hint')
}

function revealCell(location) {
    const cell = gBoard[location.i][location.j]
    if (!cell.isShown) {
        cell.isShown = true
        document.querySelector(`.cell-${location.i}-${location.j}`).classList.add('hinted')
        const val = cell.isMine ? MINE : cell.minesAroundCount
        renderCell(location, val)

        setTimeout(() => {
            cell.isShown = false
            document.querySelector(`.cell-${location.i}-${location.j}`).classList.remove('hinted')
            renderBoard()
            renderHintIcons()
        }, 1000)
    }
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