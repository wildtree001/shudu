<template>
  <div class="sudoku-grid" @keydown="handleKeydown" tabindex="0">
    <div class="grid-wrapper">
      <div
        v-for="row in 9"
        :key="row - 1"
        class="grid-row"
      >
        <div
          v-for="col in 9"
          :key="col - 1"
          class="grid-cell"
          :class="{
            'selected': selectedCell && selectedCell.row === row - 1 && selectedCell.col === col - 1,
            'fixed': isFixedCell(row - 1, col - 1),
            'error': hasError(row - 1, col - 1),
            'highlight': isHighlighted(row - 1, col - 1),
            'same-number': isSameNumber(row - 1, col - 1),
            'border-right': (col - 1) % 3 === 2 && col < 9,
            'border-bottom': (row - 1) % 3 === 2 && row < 9
          }"
          @click="selectCell(row - 1, col - 1)"
        >
          <template v-if="getCellValue(row - 1, col - 1) !== 0">
            <span class="cell-number" :class="{ 'user-input': !isFixedCell(row - 1, col - 1) }">
              {{ getCellValue(row - 1, col - 1) }}
            </span>
          </template>
          <template v-else-if="showNotes && getNotes(row - 1, col - 1).length > 0">
            <div class="cell-notes">
              <span
                v-for="note in getNotes(row - 1, col - 1)"
                :key="note"
                class="note"
              >
                {{ note }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { checkConflicts } from '../utils/sudoku.js'

const props = defineProps({
  grid: {
    type: Array,
    required: true
  },
  originalGrid: {
    type: Array,
    required: true
  },
  notes: {
    type: Object,
    default: () => ({})
  },
  selectedCell: {
    type: Object,
    default: null
  },
  showNotes: {
    type: Boolean,
    default: false
  },
  solution: {
    type: Array,
    default: null
  }
})

const emit = defineEmits(['selectCell', 'cellChange', 'notesChange'])

function getCellValue(row, col) {
  return props.grid[row][col]
}

function isFixedCell(row, col) {
  return props.originalGrid[row][col] !== 0
}

function hasError(row, col) {
  const value = props.grid[row][col]
  if (value === 0) return false
  const conflicts = checkConflicts(props.grid, row, col)
  if (conflicts.length > 0) return true
  if (props.solution && props.solution[row][col] !== value) return true
  return false
}

function isHighlighted(row, col) {
  if (!props.selectedCell) return false
  const { row: selRow, col: selCol } = props.selectedCell
  if (row === selRow || col === selCol) return true
  const boxRow = Math.floor(selRow / 3)
  const boxCol = Math.floor(selCol / 3)
  if (Math.floor(row / 3) === boxRow && Math.floor(col / 3) === boxCol) return true
  return false
}

function isSameNumber(row, col) {
  if (!props.selectedCell) return false
  const selectedValue = props.grid[props.selectedCell.row][props.selectedCell.col]
  if (selectedValue === 0) return false
  return props.grid[row][col] === selectedValue
}

function getNotes(row, col) {
  const key = `${row}-${col}`
  return props.notes[key] || []
}

function selectCell(row, col) {
  emit('selectCell', { row, col })
}

function handleKeydown(event) {
  if (!props.selectedCell) return
  
  const { row, col } = props.selectedCell
  const key = event.key
  
  if (key >= '1' && key <= '9') {
    const num = parseInt(key)
    if (!isFixedCell(row, col)) {
      emit('cellChange', { row, col, value: num })
    }
    event.preventDefault()
  } else if (key === 'Backspace' || key === 'Delete') {
    if (!isFixedCell(row, col)) {
      emit('cellChange', { row, col, value: 0 })
    }
    event.preventDefault()
  } else if (key === 'ArrowUp' && row > 0) {
    emit('selectCell', { row: row - 1, col })
    event.preventDefault()
  } else if (key === 'ArrowDown' && row < 8) {
    emit('selectCell', { row: row + 1, col })
    event.preventDefault()
  } else if (key === 'ArrowLeft' && col > 0) {
    emit('selectCell', { row, col: col - 1 })
    event.preventDefault()
  } else if (key === 'ArrowRight' && col < 8) {
    emit('selectCell', { row, col: col + 1 })
    event.preventDefault()
  }
}
</script>

<style scoped>
.sudoku-grid {
  outline: none;
}

.grid-wrapper {
  display: flex;
  flex-direction: column;
  border: 3px solid #333;
  background: white;
}

.grid-row {
  display: flex;
}

.grid-cell {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: background-color 0.15s ease;
}

.grid-cell.border-right {
  border-right: 2px solid #333;
}

.grid-cell.border-bottom {
  border-bottom: 2px solid #333;
}

.grid-cell:hover {
  background-color: #f5f5f5;
}

.grid-cell.selected {
  background-color: #e3f2fd;
}

.grid-cell.highlight {
  background-color: #f0f4ff;
}

.grid-cell.same-number {
  background-color: #e8f0f8;
}

.grid-cell.error {
  background-color: #ffebee;
}

.grid-cell.error .cell-number {
  color: #d32f2f;
}

.grid-cell.fixed .cell-number {
  font-weight: bold;
  color: #1a1a1a;
}

.cell-number {
  font-size: 22px;
  color: #1976d2;
}

.cell-number.user-input {
  font-weight: 500;
}

.cell-notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 2px;
}

.note {
  font-size: 10px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
