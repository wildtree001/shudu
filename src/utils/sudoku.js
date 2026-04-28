const GRID_SIZE = 9
const BOX_SIZE = 3

export function createEmptyGrid() {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
}

export function isValidMove(grid, row, col, num) {
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[row][i] === num) return false
  }
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i][col] === num) return false
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
  for (let i = boxRow; i < boxRow + BOX_SIZE; i++) {
    for (let j = boxCol; j < boxCol + BOX_SIZE; j++) {
      if (grid[i][j] === num) return false
    }
  }
  return true
}

export function solveSudoku(grid) {
  const newGrid = grid.map(row => [...row])
  const result = solveSudokuHelper(newGrid)
  return result ? newGrid : null
}

function solveSudokuHelper(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= GRID_SIZE; num++) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num
            if (solveSudokuHelper(grid)) {
              return true
            }
            grid[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

export function countSolutions(grid, limit = 2) {
  const newGrid = grid.map(row => [...row])
  let count = 0
  countSolutionsHelper(newGrid, limit, () => { count++ })
  return count
}

function countSolutionsHelper(grid, limit, callback) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        for (let num = 1; num <= GRID_SIZE; num++) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num
            countSolutionsHelper(grid, limit, callback)
            grid[row][col] = 0
            if (count >= limit) return
          }
        }
        return
      }
    }
  }
  callback()
}

export function generateFullGrid() {
  const grid = createEmptyGrid()
  fillGrid(grid)
  return grid
}

function fillGrid(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of numbers) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num
            if (fillGrid(grid)) {
              return true
            }
            grid[row][col] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateSudoku(difficulty) {
  const fullGrid = generateFullGrid()
  const puzzle = fullGrid.map(row => [...row])
  const cellsToRemove = getCellsToRemoveByDifficulty(difficulty)
  const positions = []
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      positions.push([i, j])
    }
  }
  shuffle(positions)
  let removed = 0
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break
    const backup = puzzle[row][col]
    puzzle[row][col] = 0
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[row][col] = backup
    } else {
      removed++
    }
  }
  return {
    puzzle,
    solution: fullGrid,
    difficulty
  }
}

function getCellsToRemoveByDifficulty(difficulty) {
  switch (difficulty) {
    case 'easy':
      return 40
    case 'medium':
      return 50
    case 'hard':
      return 60
    default:
      return 45
  }
}

export function evaluateDifficulty(grid) {
  const emptyCells = countEmptyCells(grid)
  if (emptyCells <= 40) return 'easy'
  if (emptyCells <= 50) return 'medium'
  return 'hard'
}

function countEmptyCells(grid) {
  let count = 0
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) count++
    }
  }
  return count
}

export function checkConflicts(grid, row, col) {
  const conflicts = []
  const num = grid[row][col]
  if (num === 0) return conflicts
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== col && grid[row][i] === num) {
      conflicts.push([row, i])
    }
  }
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== row && grid[i][col] === num) {
      conflicts.push([i, col])
    }
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
  for (let i = boxRow; i < boxRow + BOX_SIZE; i++) {
    for (let j = boxCol; j < boxCol + BOX_SIZE; j++) {
      if (i !== row && j !== col && grid[i][j] === num) {
        conflicts.push([i, j])
      }
    }
  }
  return conflicts
}

export function isComplete(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) return false
    }
  }
  return true
}

export function isValidGrid(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] !== 0) {
        if (!isValidMove(grid, row, col, grid[row][col])) {
          return false
        }
      }
    }
  }
  return true
}

export function cloneGrid(grid) {
  return grid.map(row => [...row])
}

export function gridsEqual(grid1, grid2) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid1[row][col] !== grid2[row][col]) {
        return false
      }
    }
  }
  return true
}
