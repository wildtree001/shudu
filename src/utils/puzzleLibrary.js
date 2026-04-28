import { generateSudoku, solveSudoku, countSolutions, evaluateDifficulty } from './sudoku.js'

const STORAGE_KEY = 'sudoku_library'
const LEADERBOARD_KEY = 'sudoku_leaderboard'
const COMPLETED_KEY = 'sudoku_completed'

const defaultPuzzles = {
  easy: [
    {
      id: 'easy_1',
      name: '入门练习 1',
      puzzle: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
      ],
      difficulty: 'easy',
      source: 'default'
    },
    {
      id: 'easy_2',
      name: '入门练习 2',
      puzzle: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0]
      ],
      difficulty: 'easy',
      source: 'default'
    }
  ],
  medium: [
    {
      id: 'medium_1',
      name: '进阶挑战 1',
      puzzle: [
        [0, 0, 0, 0, 0, 0, 0, 1, 2],
        [0, 0, 0, 0, 3, 5, 0, 0, 0],
        [0, 0, 0, 6, 0, 0, 0, 7, 0],
        [7, 0, 0, 0, 0, 0, 3, 0, 0],
        [0, 0, 0, 4, 0, 0, 8, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 2, 0, 0, 0, 0],
        [0, 8, 0, 0, 0, 0, 0, 4, 0],
        [0, 5, 0, 0, 0, 6, 0, 0, 0]
      ],
      difficulty: 'medium',
      source: 'default'
    },
    {
      id: 'medium_2',
      name: '进阶挑战 2',
      puzzle: [
        [0, 0, 4, 0, 5, 0, 0, 0, 0],
        [9, 0, 0, 7, 3, 4, 6, 0, 0],
        [0, 0, 3, 0, 2, 1, 0, 4, 9],
        [0, 3, 5, 0, 9, 0, 4, 8, 0],
        [0, 9, 0, 0, 0, 0, 0, 3, 0],
        [0, 7, 6, 0, 1, 0, 9, 2, 0],
        [3, 1, 0, 9, 7, 0, 2, 0, 0],
        [0, 0, 9, 1, 8, 2, 0, 0, 3],
        [0, 0, 0, 0, 6, 0, 1, 0, 0]
      ],
      difficulty: 'medium',
      source: 'default'
    }
  ],
  hard: [
    {
      id: 'hard_1',
      name: '专家级 1',
      puzzle: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 8, 5],
        [0, 0, 1, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 7, 0, 0, 0],
        [0, 0, 4, 0, 0, 0, 1, 0, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 0],
        [5, 0, 0, 0, 0, 0, 0, 7, 3],
        [0, 0, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 9]
      ],
      difficulty: 'hard',
      source: 'default'
    },
    {
      id: 'hard_2',
      name: '专家级 2',
      puzzle: [
        [8, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 3, 6, 0, 0, 0, 0, 0],
        [0, 7, 0, 0, 9, 0, 2, 0, 0],
        [0, 5, 0, 0, 0, 7, 0, 0, 0],
        [0, 0, 0, 0, 4, 5, 7, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 3, 0],
        [0, 0, 1, 0, 0, 0, 0, 6, 8],
        [0, 0, 8, 5, 0, 0, 0, 1, 0],
        [0, 9, 0, 0, 0, 0, 4, 0, 0]
      ],
      difficulty: 'hard',
      source: 'default'
    }
  ]
}

export function getPuzzleLibrary() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  savePuzzleLibrary(defaultPuzzles)
  return { ...defaultPuzzles }
}

export function savePuzzleLibrary(library) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
}

export function getPuzzlesByDifficulty(difficulty) {
  const library = getPuzzleLibrary()
  return library[difficulty] || []
}

export function getPuzzleById(id) {
  const library = getPuzzleLibrary()
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const puzzles = library[difficulty] || []
    const found = puzzles.find(p => p.id === id)
    if (found) return found
  }
  return null
}

export function addCustomPuzzle(puzzleData) {
  const library = getPuzzleLibrary()
  const difficulty = puzzleData.difficulty || evaluateDifficulty(puzzleData.puzzle)
  
  if (!library[difficulty]) {
    library[difficulty] = []
  }
  
  const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newPuzzle = {
    id,
    name: puzzleData.name || `自定义数独 ${library[difficulty].length + 1}`,
    puzzle: puzzleData.puzzle,
    difficulty,
    source: 'custom'
  }
  
  library[difficulty].push(newPuzzle)
  savePuzzleLibrary(library)
  return newPuzzle
}

export function deletePuzzle(id) {
  const library = getPuzzleLibrary()
  for (const difficulty of ['easy', 'medium', 'hard']) {
    if (library[difficulty]) {
      const index = library[difficulty].findIndex(p => p.id === id)
      if (index !== -1) {
        library[difficulty].splice(index, 1)
        savePuzzleLibrary(library)
        return true
      }
    }
  }
  return false
}

export function getCompletedPuzzles() {
  const stored = localStorage.getItem(COMPLETED_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function markPuzzleCompleted(puzzleId, time) {
  const completed = getCompletedPuzzles()
  completed[puzzleId] = {
    completed: true,
    lastPlayed: Date.now(),
    bestTime: completed[puzzleId]?.bestTime 
      ? Math.min(completed[puzzleId].bestTime, time) 
      : time
  }
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed))
  
  updateLeaderboard(puzzleId, time)
}

export function isPuzzleCompleted(puzzleId) {
  const completed = getCompletedPuzzles()
  return completed[puzzleId]?.completed || false
}

export function getLeaderboard() {
  const stored = localStorage.getItem(LEADERBOARD_KEY)
  return stored ? JSON.parse(stored) : {}
}

export function updateLeaderboard(puzzleId, time) {
  const leaderboard = getLeaderboard()
  if (!leaderboard[puzzleId]) {
    leaderboard[puzzleId] = []
  }
  
  leaderboard[puzzleId].push({
    time,
    date: Date.now()
  })
  
  leaderboard[puzzleId].sort((a, b) => a.time - b.time)
  leaderboard[puzzleId] = leaderboard[puzzleId].slice(0, 10)
  
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard))
}

export function getPuzzleLeaderboard(puzzleId) {
  const leaderboard = getLeaderboard()
  return leaderboard[puzzleId] || []
}

export function validatePuzzle(puzzle) {
  const numSolutions = countSolutions(puzzle, 2)
  const solution = solveSudoku(puzzle)
  
  return {
    isValid: numSolutions === 1,
    hasSolution: solution !== null,
    numSolutions,
    solution,
    difficulty: evaluateDifficulty(puzzle)
  }
}

export function generateRandomPuzzle(difficulty) {
  const result = generateSudoku(difficulty)
  const id = `generated_${Date.now()}`
  return {
    id,
    name: `随机${getDifficultyName(difficulty)}`,
    puzzle: result.puzzle,
    solution: result.solution,
    difficulty,
    source: 'generated'
  }
}

function getDifficultyName(difficulty) {
  switch (difficulty) {
    case 'easy': return '简单'
    case 'medium': return '普通'
    case 'hard': return '困难'
    default: return '数独'
  }
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
