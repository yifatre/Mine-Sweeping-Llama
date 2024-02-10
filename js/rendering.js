'use strict'

const LLAMA_IMG = 'img/llama.png'
const HAPPY_LLAMA_IMG = 'img/happy_llama.png'
const SAD_LLAMA_IMG = 'img/sad_llama.png'

var gIsDarkMode = false

function renderBoard() {
    var strHTML = ''
    for (var i = 0; i < gGame.level.SIZE; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gGame.level.SIZE; j++) {
            var cell = gBoard[i][j].isMarked ? FLAG : EMPTY
            var strClassName = ''
            if (gBoard[i][j].isShown) {
                cell = gBoard[i][j].isMine ? EXPLODED_MINE : gBoard[i][j].minesAroundCount
                if (!cell) cell = EMPTY
                strClassName = 'shown'
            }
            if (gIsDarkMode) strClassName += ' dark'
            strHTML += `<td class="${strClassName} cell-${i}-${j}" onClick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(event, ${i}, ${j})"><span>${cell}</span></td>`
        }
        strHTML += '</tr>'
    }
    document.querySelector('.board').innerHTML = strHTML
}

function renderCell(location, value) {
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    if (!value) value = EMPTY
    if (value === MINE) {
        elCell.classList.add('mine')
    }
    elCell.innerHTML = value
    if (!gBoard[location.i][location.j].isShown) elCell.classList.remove('shown')
    else elCell.classList.add('shown')
}

function renderLevelButtons() {
    var strHTML = ''
    for (var i = 0; i < gLevels.length; i++) {
        strHTML += `<button onclick="changeLevel(${i})">${gLevels[i].SIZE}</button>`
    }
    document.querySelector('.levels').innerHTML = strHTML
}

function getFormattedTime(totalSecs) {
    const mins = (Math.floor(totalSecs / 60) + '').padStart(2, '0')
    const secs = (totalSecs % 60 + '').padStart(2, '0')
    return { mins, secs }
}

function renderTimer() {
    const timePassed = getFormattedTime(gGame.secsPassed)
    document.querySelector('.timer').innerText = `${timePassed.mins}:${timePassed.secs}`
}

function renderLives() {
    var strHTML = ''
    for (var i = 0; i < gMaxLives; i++) {
        var currLife
        if (i < gGame.lives) currLife = LIFE_ON
        else currLife = gIsDarkMode ? LIFE_OFF_DARK : LIFE_OFF
        strHTML += `<span>${currLife}</span>`
    }
    document.querySelector('.lives').innerHTML = strHTML
}

function renderMinesLeft() {
    var minesLeft = (gGame.level.MINES - gDeletedMinesCount - (gMaxLives - gGame.lives) - gGame.markedCount)
    if (minesLeft < 0) {
        minesLeft = -minesLeft
        document.querySelector('.minus').classList.remove('hidden')
    }
    else document.querySelector('.minus').classList.add('hidden')

    minesLeft = (minesLeft + '').padStart(2, '0')
    document.querySelector('.mines-left').innerText = `${minesLeft}`
}

function renderHintIcons() {
    var strHTML = ''
    for (var i = 0; i < gMaxHints; i++) {
        const className = i < gGame.hints ? '' : 'hidden'
        strHTML += `<span class="${className}" onclick="onHintClicked(this)">${HINT}</span>`
    }
    document.querySelector('.hints').innerHTML = strHTML
}

function renderSafeIcons() {
    var strHTML = ''
    for (var i = 0; i < gMaxSafes; i++) {
        const className = i < gGame.safes ? '' : 'safe'
        strHTML += `<span class="${className}" onclick="onSafeClicked(this)">${SAFE}</span>`
    }
    document.querySelector('.safes').innerHTML = strHTML
}

function renderLlama(img) {
    var im = document.querySelector('.llama')
    im.src = img
    if (img === HAPPY_LLAMA_IMG) im.classList.add('happy')
    else im.classList.remove('happy')
}

function toggleDarkMode(elBtn) {
    if (!gIsDarkMode) {
        gIsDarkMode = true
        const els = document.querySelectorAll('*')
        for (var i = 0; i < els.length; i++) {
            els[i].classList.add('dark')
        }
        renderLives()
        elBtn.innerText = 'Light Mode'
        return
    }
    gIsDarkMode = false
    const els = document.querySelectorAll('*')
    for (var i = 0; i < els.length; i++) {
        els[i].classList.remove('dark')
    }
    renderLives()
    elBtn.innerText = 'Dark Mode'
}

function renderBestTime() {
    const storedTime = localStorage.getItem(`bestScoreForLevel${gGame.level.SIZE}`)
    if (!storedTime) return document.querySelector('.best-score').classList.add('hidden')
    document.querySelector('.best-score').classList.remove('hidden')
    const formattedTime = getFormattedTime(+storedTime)
    document.querySelector('.level').innerText = gGame.level.SIZE
    document.querySelector('.best-time').innerText = `${formattedTime.mins}:${formattedTime.secs}`
}

function renderCreateDivs() {
    const elBtn = document.querySelector('.create-btn')
    elBtn.innerText = `Create your own board`
    elBtn.disabled = false
    document.querySelector('div.create').classList.add('hidden')
}

function revealCell(location, duration = 1000) {
    const cell = gBoard[location.i][location.j]
    if (!cell.isShown) {
        document.querySelector(`.cell-${location.i}-${location.j}`).classList.add('hinted')
        const val = cell.isMine ? MINE : cell.minesAroundCount
        renderCell(location, val)

        setTimeout(() => {
            document.querySelector(`.cell-${location.i}-${location.j}`).classList.remove('hinted')
            renderBoard()
            const pressedHint = document.querySelector('.pressed-hint')
            if (pressedHint) pressedHint.classList.add('hidden')
        }, duration)
    }
}

function showMegaHint() {
    const iMax = Math.max(gMegaHintLocations[0].i, gMegaHintLocations[1].i)
    const jMax = Math.max(gMegaHintLocations[0].j, gMegaHintLocations[1].j)

    const iMin = Math.min(gMegaHintLocations[0].i, gMegaHintLocations[1].i)
    const jMin = Math.min(gMegaHintLocations[0].j, gMegaHintLocations[1].j)

    for (var i = iMin; i <= iMax; i++) {
        for (var j = jMin; j <= jMax; j++) {
            revealCell({ i, j }, 2000)
        }
    }
    const elImg = document.querySelector('.mega-hint')
    elImg.classList.add('used')
    gIsMegaHint = false
}