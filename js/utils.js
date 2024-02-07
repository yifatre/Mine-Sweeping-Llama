function countNegs(board, rowIdx, colIdx) {
    var count = 0

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            var currCell = board[i][j]
            if (currCell.isMine) count++
        }
    }
    return count
}

function negsLoop(func, board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            var currCell = board[i][j]
            func(currCell)
        }
    }
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function playAudio(audioFileName) {
    const sound = new Audio(`audio/${audioFileName}`)
    sound.play()
}

function getEmptyCells(board) {
    var emptyCells = []
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine) emptyCells.push({ i, j })
        }
    }
    return emptyCells
}

function getRandomEmptyCell(board) {
    var emptyCells = getEmptyCells(board)
    return emptyCells[getRandomIntInclusive(0, emptyCells.length - 1)]
}

function openModal() {
    document.querySelector('.modal').classList.remove('hide')
}

function closeModal() {
    document.querySelector('.modal').classList.add('hide')
}
