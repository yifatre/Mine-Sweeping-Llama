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
            var cell = gBoard[i][j].isMarked ? FLAG : ''
            var strClassName = ''
            if (gBoard[i][j].isShown) {
                cell = gBoard[i][j].isMine ? EXPLODED_MINE : gBoard[i][j].minesAroundCount
                if (!cell) cell = ''
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
    if (!value) value = ''
    if (value === MINE) {
        elCell.classList.add('mine')
    }
    elCell.innerHTML = value
}

function renderLevelButtons() {
    var strHTML = ''
    for (var i = 0; i < gLevels.length; i++) {
        strHTML += `<button onclick="changeLevel(${i})">${gLevels[i].SIZE}</button>`
    }
    document.querySelector('.levels').innerHTML = strHTML
}

function renderTimer() {
    const mins = (Math.floor(gGame.secsPassed / 60) + '').padStart(2, '0')
    const secs = (gGame.secsPassed % 60 + '').padStart(2, '0')
    document.querySelector('.timer').innerText = `${mins}:${secs}`
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