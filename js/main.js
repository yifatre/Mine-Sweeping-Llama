'use strict'

const MINE = '💣'
const EXPLODED_MINE = '💥'
const FLAG = '🚩'
const LIFE_ON = '💖'
const LIFE_OFF = '🤍'
const LIFE_OFF_DARK = '🖤'
const HINT = '💡'
const SAFE = '🛡️'
const EMPTY = ''

const gLevels = [{ SIZE: 4, MINES: 2 }, { SIZE: 8, MINES: 14 }, { SIZE: 12, MINES: 32 }]

const gGame = {}
gGame.level = gLevels[0]

var gIsCreateMode
var gMinesPositioned

const gMaxLives = 3
const gMaxHints = 3
const gMaxSafes = 3

var gBoard = []
var gGameInterval

var gIsHint = false
var gIsMegaHint = false
var gMegaHintLocations = []
var gDeletedMinesCount

function onInit() {
    renderLevelButtons()
    startGame()
}

function startGame() {
    gIsCreateMode = false
    resetGame()
    gBoard = buildBoard()
    gMinesPositioned = 0
    renderBoard()
    renderLives()
    renderHintIcons()
    renderSafeIcons()
    renderMinesLeft()
    renderBestTime()
    renderCreateDivs()
    closeModal()
    clearInterval(gGameInterval)
    gIsHint = false
    gIsMegaHint = false
    gMegaHintLocations = []
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
    gGame.safes = gMaxSafes
    gGame.startTime = null
    gGame.moves = []

    if (gDeletedMinesCount) document.querySelector('.used').classList.remove('used')
    if (gMegaHintLocations.length) document.querySelector('.mega-hint').classList.remove('used')
    gDeletedMinesCount = 0
    renderTimer()
    renderLlama(LLAMA_IMG)
}

function buildBoard() {
    const board = []
    for (var i = 0; i < gGame.level.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gGame.level.SIZE; j++) {
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
    for (var i = 0; i < gGame.level.SIZE; i++) {
        for (var j = 0; j < gGame.level.SIZE; j++) {
            const minesCount = countNegs(board, i, j)
            board[i][j].minesAroundCount = minesCount
        }
    }
}

function onCellClicked(elCell, i, j) {
    if (gIsCreateMode) {
        gBoard[i][j].isMine = true
        renderCell({ i, j }, MINE)
        gMinesPositioned++
        const elSpan = document.querySelector('span.create')
        elSpan.innerText = `${gGame.level.MINES - gMinesPositioned}`
        if (gMinesPositioned === gGame.level.MINES) {
            gIsCreateMode = false
            const elBtn = document.querySelector('.create-btn')
            elBtn.innerText = "Start Playing!"
            elBtn.disabled = true
            document.querySelector('div.create').classList.add('hidden')
            renderBoard()
        }
        return
    }

    if (!gGame.startTime) {
        if (!gMinesPositioned) addMines(gBoard, { i, j })
        setMinesNegsCount(gBoard)
        gGame.startTime = Date.now()
        gGameInterval = setInterval(() => {
            gGame.secsPassed = Math.floor((Date.now() - gGame.startTime) / 1000)
            renderTimer()
        }, 1000)
    }

    if (!gGame.isOn) return

    const boardCell = gBoard[i][j]
    if (boardCell.isMarked) return
    if (boardCell.isShown) return

    if (gIsHint) {
        revealCell({ i, j }, 1000)
        negsLoop(revealCell, gBoard, i, j)
        gIsHint = false
        return
    }

    if (gIsMegaHint) {
        gMegaHintLocations.push({ i, j })
        if (gMegaHintLocations.length === 2) showMegaHint()
        return
    }

    if (boardCell.minesAroundCount === 0 && !boardCell.isMine) {
        expandShownRec(gBoard, { i, j })
    }
    else {
        gGame.moves.push({ i, j })
        gGame.shownCount++
    }

    boardCell.isShown = true
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
        }
    }
    const cellValue = boardCell.isMine ? EXPLODED_MINE : boardCell.minesAroundCount
    renderCell({ i, j }, cellValue)

    if (checkGameOver()) onWin()
}

function onCellMarked(event, i, j) {
    event.preventDefault()
    if (!gGame.isOn) return
    const boardCell = gBoard[i][j]
    if (boardCell.isShown) return
    if (boardCell.isMarked) {
        boardCell.isMarked = false
        gGame.markedCount--
        renderCell({ i, j }, EMPTY)
    }
    else {
        boardCell.isMarked = true
        gGame.markedCount++
        renderCell({ i, j }, FLAG)
    }
    renderMinesLeft()
    if (checkGameOver()) onWin()
}

function checkGameOver() {
    const livesUsed = gMaxLives - gGame.lives
    return (gGame.markedCount + livesUsed === gGame.level.MINES - gDeletedMinesCount &&
        gGame.level.SIZE ** 2 === gGame.shownCount + gGame.markedCount)
}

function onWin() {
    renderLlama(HAPPY_LLAMA_IMG)
    document.body.classList.add('win')
    playAudio('twinkles.mp3')
    gGame.isOn = false
    clearInterval(gGameInterval)
    keepBestScore()
    renderBestTime()
    document.querySelector('.msg').innerText = 'You Win!'
    setTimeout(openModal, 100)
}

function expandShownRec(board, location) {
    if (board[location.i][location.j].isMarked) return
    if (board[location.i][location.j].isMine) return
    if (board[location.i][location.j].isShown) return
    if (!board[location.i][location.j].isShown) {
        gGame.shownCount++
        board[location.i][location.j].isShown = true
    }
    renderCell(location, board[location.i][location.j].minesAroundCount)
    gGame.moves.push(location)
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
    for (var i = 0; i < gGame.level.MINES; i++) {
        const emptyCells = getEmptyCells(board, excludeLocation)
        const randLocation = getRandomCellsLocations(emptyCells, 1)[0]
        const cell = board[randLocation.i][randLocation.j]
        cell.isMine = true
    }
}

function showMines() {
    for (var i = 0; i < gGame.level.SIZE; i++) {
        for (var j = 0; j < gGame.level.SIZE; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isShown) renderCell({ i, j }, MINE)
        }
    }
}

function changeLevel(i) {
    gGame.level = gLevels[i]
    startGame()
}

function onHintClicked(elSpan) {
    if (!gGame.startTime) return
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

function onSafeClicked(elSpan) {
    if (!gGame.startTime) return
    const cells = getEmptyCells(gBoard)
    const safeCell = getRandomCellsLocations(cells)[0]
    const cell = document.querySelector(`.cell-${safeCell.i}-${safeCell.j}`)
    cell.classList.add('safe-cell')
    setTimeout(() => cell.classList.remove('safe-cell'), 2000)
    gGame.safes--
    elSpan.classList.add('hidden')
}

function mineExterminatorClicked(elSpan) {
    if (!gGame.startTime) return
    if (gDeletedMinesCount) return
    const minesLocations = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isShown) minesLocations.push({ i, j })
        }
    }
    const minesToDelete = getRandomCellsLocations(minesLocations, Math.min(3, minesLocations.length))
    for (var i = 0; i < minesToDelete.length; i++) {
        const location = minesToDelete[i]
        gBoard[location.i][location.j].isMine = false
        gDeletedMinesCount++
    }
    setMinesNegsCount(gBoard)
    renderBoard()
    renderMinesLeft()
    elSpan.classList.add('used')
}

function keepBestScore() {
    var bestScore = localStorage.getItem(`bestScoreForLevel${gGame.level.SIZE}`)
    if (!bestScore) localStorage.setItem(`bestScoreForLevel${gGame.level.SIZE}`, gGame.secsPassed)
    else if (gGame.secsPassed < bestScore) {
        localStorage.setItem(`bestScoreForLevel${gGame.level.SIZE}`, gGame.secsPassed)
    }
}

function onCreateBtnClicked(elBtn) {
    const elSpan = document.querySelector('span.create')
    if (gIsCreateMode) {
        startGame()
        document.querySelector('div.create').classList.add('hidden')
        elBtn.innerText = 'Create your own board'
        return
    }
    startGame()
    gIsCreateMode = true
    gMinesPositioned = 0
    elBtn.innerText = 'Cancel'
    elSpan.innerText = `${gGame.level.MINES}`
    document.querySelector('div.create').classList.remove('hidden')
}

function undo() {
    if (!gGame.moves.length) return
    const move = gGame.moves.pop()
    gBoard[move.i][move.j].isShown = false
    gGame.shownCount--
    renderCell(move, EMPTY)
}

function megaHintClicked() {
    if (!gGame.startTime) return
    if (gMegaHintLocations.length > 0) return
    if (gIsMegaHint) return gIsMegaHint = false
    gIsMegaHint = true
}
