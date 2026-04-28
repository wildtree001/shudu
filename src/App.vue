<template>
  <div class="app">
    <header class="app-header">
      <h1>🧩 数独游戏</h1>
      <div class="nav-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-tab"
          :class="{ active: currentTab === tab.key }"
          @click="currentTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </header>

    <main class="app-main">
      <div v-if="currentTab === 'game'" class="game-view">
        <div class="game-sidebar">
          <div class="game-info">
            <div class="timer">
              <span class="timer-label">用时</span>
              <span class="timer-value">{{ formatTime(elapsedTime) }}</span>
            </div>
            <div class="difficulty-badge" :class="currentDifficulty">
              {{ getDifficultyLabel(currentDifficulty) }}
            </div>
            <div v-if="currentPuzzle" class="puzzle-info">
              <span class="puzzle-name">{{ currentPuzzle.name }}</span>
            </div>
          </div>

          <div class="control-buttons">
            <button class="btn primary" @click="startNewGame">新游戏</button>
            <button class="btn secondary" @click="undo" :disabled="history.length === 0">撤销</button>
            <button class="btn secondary" @click="toggleEraseMode" :class="{ active: eraseMode }">擦除</button>
            <button class="btn secondary" @click="toggleNoteMode" :class="{ active: noteMode }">笔记</button>
            <button class="btn secondary" @click="getHint">提示</button>
            <button class="btn secondary" @click="solvePuzzle">求解</button>
            <button class="btn secondary" @click="checkSolution">检查</button>
            <button class="btn secondary" @click="clearInput">清空</button>
          </div>

          <div class="number-pad">
            <button
              v-for="num in 9"
              :key="num"
              class="num-btn"
              @click="inputNumber(num)"
            >
              {{ num }}
            </button>
          </div>
        </div>

        <div class="game-board">
          <SudokuGrid
            :grid="currentGrid"
            :originalGrid="originalGrid"
            :notes="notes"
            :selectedCell="selectedCell"
            :showNotes="noteMode"
            :solution="solution"
            @selectCell="handleSelectCell"
            @cellChange="handleCellChange"
          />
        </div>
      </div>

      <div v-else-if="currentTab === 'library'" class="library-view">
        <div class="library-header">
          <h2>📚 数独题库</h2>
          <div class="difficulty-filters">
            <button
              v-for="diff in ['easy', 'medium', 'hard']"
              :key="diff"
              class="filter-btn"
              :class="{ active: selectedDifficulty === diff }"
              @click="selectedDifficulty = diff"
            >
              {{ getDifficultyLabel(diff) }}
            </button>
          </div>
        </div>

        <div class="puzzle-list">
          <div
            v-for="puzzle in filteredPuzzles"
            :key="puzzle.id"
            class="puzzle-card"
            :class="{ completed: isCompleted(puzzle.id) }"
            @click="selectPuzzle(puzzle)"
          >
            <div class="puzzle-card-header">
              <span class="puzzle-card-name">{{ puzzle.name }}</span>
              <span v-if="isCompleted(puzzle.id)" class="completed-badge">✓ 已完成</span>
            </div>
            <div class="puzzle-card-info">
              <span class="puzzle-source">{{ puzzle.source === 'default' ? '预置' : puzzle.source === 'custom' ? '自定义' : '随机' }}</span>
              <span v-if="getBestTime(puzzle.id)" class="best-time">
                最佳: {{ formatTime(getBestTime(puzzle.id)) }}
              </span>
            </div>
            <div class="puzzle-card-actions">
              <button class="btn small primary" @click.stop="playPuzzle(puzzle)">开始游戏</button>
              <button v-if="puzzle.source === 'custom'" class="btn small danger" @click.stop="deletePuzzleFromLibrary(puzzle)">删除</button>
              <button class="btn small secondary" @click.stop="showLeaderboard(puzzle)">排行榜</button>
            </div>
          </div>

          <div v-if="filteredPuzzles.length === 0" class="empty-state">
            <p>暂无该难度的题目</p>
          </div>
        </div>
      </div>

      <div v-else-if="currentTab === 'editor'" class="editor-view">
        <div class="editor-header">
          <h2>✏️ 自定义数独编辑器</h2>
          <div class="editor-controls">
            <input
              v-model="customPuzzleName"
              type="text"
              placeholder="输入题目名称..."
              class="name-input"
            />
            <button class="btn primary" @click="validateCustomPuzzle">验证题目</button>
            <button class="btn success" @click="saveCustomPuzzle" :disabled="!validationResult?.isValid">保存到题库</button>
            <button class="btn secondary" @click="clearEditor">清空</button>
          </div>
        </div>

        <div class="editor-content">
          <div class="editor-instructions">
            <h3>使用说明</h3>
            <ul>
              <li>点击格子输入数字 1-9</li>
              <li>留空表示需要填写的格子</li>
              <li>点击"验证题目"检查是否有唯一解</li>
              <li>验证通过后可保存到题库</li>
            </ul>
          </div>

          <div class="editor-board">
            <SudokuGrid
              :grid="editorGrid"
              :originalGrid="createEmptyGrid()"
              :selectedCell="editorSelectedCell"
              @selectCell="handleEditorSelectCell"
              @cellChange="handleEditorCellChange"
            />
          </div>

          <div class="editor-result" v-if="validationResult">
            <h3>验证结果</h3>
            <div class="result-item" :class="{ valid: validationResult.hasSolution }">
              <span class="result-label">可解性:</span>
              <span class="result-value">{{ validationResult.hasSolution ? '✓ 有解' : '✗ 无解' }}</span>
            </div>
            <div class="result-item" :class="{ valid: validationResult.numSolutions === 1 }">
              <span class="result-label">唯一性:</span>
              <span class="result-value">
                {{ validationResult.numSolutions === 1 ? '✓ 唯一解' : validationResult.numSolutions > 1 ? '✗ 多解 (' + validationResult.numSolutions + ')' : '✗ 无解' }}
              </span>
            </div>
            <div class="result-item">
              <span class="result-label">评估难度:</span>
              <span class="result-value difficulty" :class="validationResult.difficulty">
                {{ getDifficultyLabel(validationResult.difficulty) }}
              </span>
            </div>
            <div v-if="validationResult.solution" class="result-item">
              <span class="result-label">提示: 系统已计算出解答</span>
            </div>
          </div>
        </div>

        <div class="editor-number-pad">
          <button
            v-for="num in 9"
            :key="num"
            class="num-btn"
            @click="inputEditorNumber(num)"
          >
            {{ num }}
          </button>
          <button class="num-btn erase" @click="inputEditorNumber(0)">⌫</button>
        </div>
      </div>
    </main>

    <div v-if="showLeaderboardModal" class="modal-overlay" @click.self="showLeaderboardModal = false">
      <div class="modal-content leaderboard-modal">
        <div class="modal-header">
          <h3>🏆 排行榜 - {{ leaderboardPuzzle?.name }}</h3>
          <button class="modal-close" @click="showLeaderboardModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="currentLeaderboard.length === 0" class="empty-leaderboard">
            <p>暂无记录，快来挑战吧！</p>
          </div>
          <div v-else class="leaderboard-list">
            <div
              v-for="(record, index) in currentLeaderboard"
              :key="index"
              class="leaderboard-item"
              :class="{ 'top-three': index < 3 }"
            >
              <span class="rank" :class="'rank-' + (index + 1)">
                {{ index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1 }}
              </span>
              <span class="time">{{ formatTime(record.time) }}</span>
              <span class="date">{{ formatDate(record.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showGameCompletedModal" class="modal-overlay" @click.self="showGameCompletedModal = false">
      <div class="modal-content completed-modal">
        <div class="modal-body">
          <div class="completed-icon">🎉</div>
          <h2>恭喜完成！</h2>
          <p class="completed-time">用时: {{ formatTime(elapsedTime) }}</p>
          <p v-if="isNewBestTime" class="new-best-time">🏆 新纪录！</p>
          <div class="completed-actions">
            <button class="btn primary" @click="startNewGame">再来一局</button>
            <button class="btn secondary" @click="showGameCompletedModal = false">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SudokuGrid from './components/SudokuGrid.vue'
import {
  cloneGrid,
  solveSudoku,
  isComplete,
  gridsEqual,
  createEmptyGrid
} from './utils/sudoku.js'
import {
  getPuzzlesByDifficulty,
  getPuzzleById,
  addCustomPuzzle,
  deletePuzzle,
  markPuzzleCompleted,
  isPuzzleCompleted,
  getPuzzleLeaderboard,
  validatePuzzle,
  generateRandomPuzzle,
  getCompletedPuzzles,
  formatTime
} from './utils/puzzleLibrary.js'

const currentTab = ref('game')
const tabs = [
  { key: 'game', label: '🎮 游戏' },
  { key: 'library', label: '📚 题库' },
  { key: 'editor', label: '✏️ 编辑器' }
]

const currentGrid = ref(createEmptyGrid())
const originalGrid = ref(createEmptyGrid())
const solution = ref(null)
const selectedCell = ref(null)
const notes = ref({})
const history = ref([])
const noteMode = ref(false)
const eraseMode = ref(false)
const elapsedTime = ref(0)
const timerInterval = ref(null)
const currentDifficulty = ref('medium')
const currentPuzzle = ref(null)

const selectedDifficulty = ref('easy')
const showLeaderboardModal = ref(false)
const leaderboardPuzzle = ref(null)

const showGameCompletedModal = ref(false)
const isNewBestTime = ref(false)

const editorGrid = ref(createEmptyGrid())
const editorSelectedCell = ref(null)
const customPuzzleName = ref('')
const validationResult = ref(null)

const filteredPuzzles = computed(() => {
  return getPuzzlesByDifficulty(selectedDifficulty.value)
})

const currentLeaderboard = computed(() => {
  if (!leaderboardPuzzle.value) return []
  return getPuzzleLeaderboard(leaderboardPuzzle.value.id)
})

function getDifficultyLabel(difficulty) {
  const labels = {
    easy: '简单',
    medium: '普通',
    hard: '困难'
  }
  return labels[difficulty] || difficulty
}

function startNewGame() {
  const puzzle = generateRandomPuzzle(currentDifficulty.value)
  currentPuzzle.value = puzzle
  originalGrid.value = cloneGrid(puzzle.puzzle)
  currentGrid.value = cloneGrid(puzzle.puzzle)
  solution.value = puzzle.solution
  selectedCell.value = null
  notes.value = {}
  history.value = []
  elapsedTime.value = 0
  startTimer()
}

function selectPuzzle(puzzle) {
  currentPuzzle.value = puzzle
}

function playPuzzle(puzzle) {
  const solutionGrid = solveSudoku(puzzle.puzzle)
  currentPuzzle.value = puzzle
  originalGrid.value = cloneGrid(puzzle.puzzle)
  currentGrid.value = cloneGrid(puzzle.puzzle)
  solution.value = solutionGrid
  selectedCell.value = null
  notes.value = {}
  history.value = []
  elapsedTime.value = 0
  currentDifficulty.value = puzzle.difficulty
  currentTab.value = 'game'
  startTimer()
}

function deletePuzzleFromLibrary(puzzle) {
  if (confirm('确定要删除这个题目吗？')) {
    deletePuzzle(puzzle.id)
  }
}

function showLeaderboard(puzzle) {
  leaderboardPuzzle.value = puzzle
  showLeaderboardModal.value = true
}

function isCompleted(puzzleId) {
  return isPuzzleCompleted(puzzleId)
}

function getBestTime(puzzleId) {
  const completed = getCompletedPuzzles()
  return completed[puzzleId]?.bestTime
}

function startTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  timerInterval.value = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function handleSelectCell(cell) {
  if (eraseMode.value && selectedCell.value && originalGrid.value[selectedCell.value.row][selectedCell.value.col] === 0) {
    handleCellChange({ ...selectedCell.value, value: 0 })
  }
  selectedCell.value = cell
}

function handleCellChange({ row, col, value }) {
  if (originalGrid.value[row][col] !== 0) return
  
  history.value.push({
    grid: cloneGrid(currentGrid.value),
    notes: JSON.parse(JSON.stringify(notes.value))
  })
  
  if (noteMode.value && value !== 0) {
    const key = `${row}-${col}`
    if (!notes.value[key]) {
      notes.value[key] = []
    }
    const index = notes.value[key].indexOf(value)
    if (index !== -1) {
      notes.value[key].splice(index, 1)
    } else {
      notes.value[key].push(value)
      notes.value[key].sort()
    }
  } else {
    currentGrid.value[row][col] = value
    const key = `${row}-${col}`
    if (notes.value[key]) {
      delete notes.value[key]
    }
  }
  
  checkGameComplete()
}

function inputNumber(num) {
  if (!selectedCell.value) return
  if (eraseMode.value) {
    handleCellChange({ ...selectedCell.value, value: 0 })
  } else {
    handleCellChange({ ...selectedCell.value, value: num })
  }
}

function undo() {
  if (history.value.length === 0) return
  const lastState = history.value.pop()
  currentGrid.value = lastState.grid
  notes.value = lastState.notes
}

function toggleEraseMode() {
  eraseMode.value = !eraseMode.value
  if (eraseMode.value) noteMode.value = false
}

function toggleNoteMode() {
  noteMode.value = !noteMode.value
  if (noteMode.value) eraseMode.value = false
}

function getHint() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (currentGrid.value[row][col] === 0 && solution.value) {
        history.value.push({
          grid: cloneGrid(currentGrid.value),
          notes: JSON.parse(JSON.stringify(notes.value))
        })
        currentGrid.value[row][col] = solution.value[row][col]
        checkGameComplete()
        return
      }
    }
  }
}

function solvePuzzle() {
  if (solution.value) {
    history.value.push({
      grid: cloneGrid(currentGrid.value),
      notes: JSON.parse(JSON.stringify(notes.value))
    })
    currentGrid.value = cloneGrid(solution.value)
    notes.value = {}
    checkGameComplete()
  }
}

function checkSolution() {
  if (!solution.value) return
  const isCorrect = gridsEqual(currentGrid.value, solution.value)
  if (isCorrect) {
    alert('恭喜！答案完全正确！')
  } else {
    alert('答案有误，请检查后重试')
  }
}

function clearInput() {
  history.value.push({
    grid: cloneGrid(currentGrid.value),
    notes: JSON.parse(JSON.stringify(notes.value))
  })
  currentGrid.value = cloneGrid(originalGrid.value)
  notes.value = {}
}

function checkGameComplete() {
  if (!isComplete(currentGrid.value)) return
  if (!solution.value) return
  
  const isCorrect = gridsEqual(currentGrid.value, solution.value)
  if (isCorrect) {
    stopTimer()
    
    if (currentPuzzle.value && currentPuzzle.value.id) {
      const prevBestTime = getBestTime(currentPuzzle.value.id)
      markPuzzleCompleted(currentPuzzle.value.id, elapsedTime.value)
      const newBestTime = getBestTime(currentPuzzle.value.id)
      isNewBestTime.value = !prevBestTime || elapsedTime.value < prevBestTime
    }
    
    showGameCompletedModal.value = true
  }
}

function handleEditorSelectCell(cell) {
  editorSelectedCell.value = cell
}

function handleEditorCellChange({ row, col, value }) {
  editorGrid.value[row][col] = value
  validationResult.value = null
}

function inputEditorNumber(num) {
  if (!editorSelectedCell.value) return
  const { row, col } = editorSelectedCell.value
  editorGrid.value[row][col] = num
  validationResult.value = null
}

function validateCustomPuzzle() {
  validationResult.value = validatePuzzle(editorGrid.value)
}

function saveCustomPuzzle() {
  if (!validationResult.value?.isValid) return
  
  const puzzle = addCustomPuzzle({
    name: customPuzzleName.value || '自定义数独',
    puzzle: cloneGrid(editorGrid.value),
    difficulty: validationResult.value.difficulty
  })
  
  alert(`题目已保存到题库！\n难度: ${getDifficultyLabel(validationResult.value.difficulty)}`)
  customPuzzleName.value = ''
  validationResult.value = null
}

function clearEditor() {
  editorGrid.value = createEmptyGrid()
  editorSelectedCell.value = null
  customPuzzleName.value = ''
  validationResult.value = null
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  startNewGame()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  color: #333;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
}

.nav-tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  background: #e0e0e0;
}

.nav-tab.active {
  background: #667eea;
  color: white;
}

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.game-view {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.game-sidebar {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 220px;
}

.game-info {
  margin-bottom: 1.5rem;
}

.timer {
  text-align: center;
  margin-bottom: 1rem;
}

.timer-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.timer-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  font-family: 'Courier New', monospace;
}

.difficulty-badge {
  display: block;
  text-align: center;
  padding: 0.5rem;
  border-radius: 8px;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #ef6c00;
}

.difficulty-badge.hard {
  background: #ffebee;
  color: #c62828;
}

.puzzle-info {
  text-align: center;
}

.puzzle-name {
  font-size: 0.9rem;
  color: #666;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #667eea;
  color: white;
}

.btn.primary:hover {
  background: #5a6fd6;
}

.btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.btn.secondary:hover {
  background: #e0e0e0;
}

.btn.secondary.active {
  background: #667eea;
  color: white;
}

.btn.success {
  background: #4caf50;
  color: white;
}

.btn.success:hover {
  background: #43a047;
}

.btn.success:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

.btn.danger {
  background: #f44336;
  color: white;
}

.btn.danger:hover {
  background: #e53935;
}

.btn.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.number-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.num-btn {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
}

.num-btn:hover {
  border-color: #667eea;
  background: #f5f7ff;
}

.game-board {
  background: rgba(255, 255, 255, 0.95);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.library-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.library-header h2 {
  margin: 0;
  color: #333;
}

.difficulty-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.puzzle-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.puzzle-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.puzzle-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.puzzle-card.completed {
  border-color: #4caf50;
  background: #f9fff9;
}

.puzzle-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.puzzle-card-name {
  font-weight: 600;
  color: #333;
}

.completed-badge {
  font-size: 0.8rem;
  color: #4caf50;
  font-weight: 600;
}

.puzzle-card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.puzzle-source {
  background: #f0f0f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.best-time {
  color: #667eea;
  font-weight: 500;
}

.puzzle-card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #666;
}

.editor-view {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.editor-header {
  margin-bottom: 1.5rem;
}

.editor-header h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.editor-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.name-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
}

.name-input:focus {
  outline: none;
  border-color: #667eea;
}

.editor-content {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.editor-instructions {
  flex: 1;
  min-width: 250px;
}

.editor-instructions h3 {
  margin-top: 0;
  color: #333;
}

.editor-instructions ul {
  padding-left: 1.25rem;
  color: #666;
  line-height: 1.8;
}

.editor-board {
  flex: 0 0 auto;
}

.editor-result {
  flex: 1;
  min-width: 250px;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 12px;
}

.editor-result h3 {
  margin-top: 0;
  color: #333;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item.valid .result-value {
  color: #4caf50;
  font-weight: 600;
}

.result-label {
  color: #666;
}

.result-value {
  font-weight: 500;
}

.result-value.difficulty {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.result-value.difficulty.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.result-value.difficulty.medium {
  background: #fff3e0;
  color: #ef6c00;
}

.result-value.difficulty.hard {
  background: #ffebee;
  color: #c62828;
}

.editor-number-pad {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.editor-number-pad .num-btn {
  width: 50px;
  height: 50px;
  padding: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 450px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 1.5rem;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f9f9f9;
}

.leaderboard-item.top-three {
  background: linear-gradient(90deg, #fff8e1, #ffecb3);
}

.rank {
  font-size: 1.25rem;
  margin-right: 1rem;
  width: 40px;
  text-align: center;
}

.time {
  font-weight: bold;
  color: #333;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  flex: 1;
}

.date {
  font-size: 0.85rem;
  color: #666;
}

.empty-leaderboard {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.completed-modal .modal-body {
  text-align: center;
}

.completed-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.completed-modal h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.completed-time {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.new-best-time {
  font-size: 1.25rem;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 1.5rem;
}

.completed-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }
  
  .app-main {
    padding: 1rem;
  }
  
  .game-view {
    flex-direction: column;
    align-items: center;
  }
  
  .game-sidebar {
    order: 2;
    width: 100%;
    max-width: 400px;
  }
  
  .game-board {
    order: 1;
  }
  
  .number-pad {
    grid-template-columns: repeat(9, 1fr);
  }
  
  .editor-content {
    flex-direction: column;
  }
  
  .puzzle-list {
    grid-template-columns: 1fr;
  }
}
</style>
