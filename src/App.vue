<template>
  <div class="container">
    <div class="header">
      <h1>🧩 数独游戏</h1>
      <p>支持多种数独变体和智能解题助手</p>
    </div>

    <div class="game-container">
      <div class="control-panel">
        <div class="control-section">
          <h3>游戏设置</h3>
          
          <div class="select-wrapper" style="margin-bottom: 15px;">
            <select v-model="selectedVariant">
              <option value="standard">标准数独</option>
              <option value="diagonal">对角线数独</option>
              <option value="irregular">不规则数独</option>
              <option value="consecutive">连续数独</option>
            </select>
          </div>

          <div class="select-wrapper" style="margin-bottom: 15px;">
            <select v-model="difficulty">
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>

          <div class="btn-group">
            <button class="btn btn-primary" @click="startNewGame" :disabled="isGenerating">
              <span v-if="isGenerating">
                <span class="spinner"></span> 生成中...
              </span>
              <span v-else>🎮 新游戏</span>
            </button>
          </div>
          
          <div v-if="isGenerating" class="loading-overlay">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <p>正在生成数独谜题...</p>
            </div>
          </div>
        </div>

        <div class="variant-info" v-if="selectedVariant !== 'standard'">
          <h4>{{ getVariantName() }}规则</h4>
          <p>{{ getVariantDescription() }}</p>
        </div>

        <div class="control-section">
          <h3>游戏状态</h3>
          <div class="game-info">
            <div class="info-item">
              <div class="info-label">用时</div>
              <div class="info-value">{{ formatTime(elapsedTime) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">提示</div>
              <div class="info-value">{{ hintsUsed }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">错误</div>
              <div class="info-value" :style="{ color: errors > 0 ? '#ef4444' : '#6366f1' }">{{ errors }}</div>
            </div>
          </div>
        </div>

        <div class="control-section">
          <h3>操作模式</h3>
          <div class="mode-indicator" :class="getModeClass()">
            {{ getModeName() }}
          </div>
          <div class="btn-group">
            <button 
              class="btn" 
              :class="currentMode === 'normal' ? 'btn-primary' : 'btn-secondary'"
              @click="setMode('normal')"
            >
              输入
            </button>
            <button 
              class="btn" 
              :class="currentMode === 'note' ? 'btn-primary' : 'btn-secondary'"
              @click="setMode('note')"
            >
              笔记
            </button>
            <button 
              class="btn" 
              :class="currentMode === 'erase' ? 'btn-danger' : 'btn-secondary'"
              @click="setMode('erase')"
            >
              擦除
            </button>
          </div>
        </div>

        <div class="control-section">
          <h3>解题助手</h3>
          <div class="btn-group">
            <button class="btn btn-success" @click="getHint" :disabled="isComplete || isSolving">
              💡 步骤提示
            </button>
            <button class="btn btn-warning" @click="solveStep" :disabled="isComplete || isSolving">
              ⏭️ 下一步
            </button>
            <button class="btn btn-primary" @click="autoSolve" :disabled="isComplete || isSolving">
              🔍 自动求解
            </button>
          </div>
          
          <div class="hint-panel" v-if="currentHint">
            <h4>解题提示</h4>
            <div class="hint-step">
              <span class="step-type">{{ getHintTypeText() }}</span>
              <span>{{ currentHint.description }}</span>
            </div>
          </div>

          <div class="btn-group" style="margin-top: 15px;">
            <button class="btn btn-secondary" @click="undo" :disabled="history.length === 0">
              ↶ 撤销
            </button>
            <button class="btn btn-secondary" @click="checkAnswer">
              ✓ 检查
            </button>
            <button class="btn btn-danger" @click="clearUserInputs">
              🗑️ 清空
            </button>
          </div>
        </div>
      </div>

      <div class="game-board">
        <div 
          class="sudoku-grid" 
          ref="sudokuGrid"
          :class="{ 'consecutive-barriers': selectedVariant === 'consecutive' }"
        >
          <div
            v-for="(cell, index) in flatGrid"
            :key="index"
            class="cell"
            :class="getCellClasses(index)"
            @click="selectCell(index)"
          >
            <template v-if="cell.value !== 0">
              {{ cell.value }}
            </template>
            <template v-else-if="cell.notes && cell.notes.length > 0">
              <span v-for="note in 9" :key="note" :style="{ visibility: cell.notes.includes(note) ? 'visible' : 'hidden' }">
                {{ note }}
              </span>
            </template>
          </div>
        </div>

        <div class="number-pad">
          <button
            v-for="num in 9"
            :key="num"
            class="number-btn"
            @click="inputNumber(num)"
          >
            {{ num }}
          </button>
          <button class="number-btn" @click="inputNumber(0)">
            ⌫
          </button>
        </div>
      </div>
    </div>

    <div class="celebration" v-if="showCelebration">
      <div class="celebration-content">
        <h2>🎉 恭喜完成！</h2>
        <p>用时：{{ formatTime(elapsedTime) }} | 提示：{{ hintsUsed }} 次</p>
        <button class="btn btn-primary" @click="showCelebration = false; startNewGame()">
          再来一局
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { SudokuCore, SudokuType } from './utils/sudoku.js';

export default {
  name: 'SudokuApp',
  setup() {
    const createEmptyGrid = () => Array(9).fill(null).map(() => Array(9).fill(0));
    const createEmptyNotes = () => Array(9).fill(null).map(() => Array(9).fill(null).map(() => []));
    
    const sudokuCore = ref(null);
    const grid = ref(createEmptyGrid());
    const solution = ref(createEmptyGrid());
    const fixedCells = ref([]);
    const notes = ref(createEmptyNotes());
    const errors = ref([]);
    const selectedCell = ref(null);
    const difficulty = ref('medium');
    const selectedVariant = ref('standard');
    const currentMode = ref('normal');
    const elapsedTime = ref(0);
    const hintsUsed = ref(0);
    const currentHint = ref(null);
    const history = ref([]);
    const isComplete = ref(false);
    const isSolving = ref(false);
    const showCelebration = ref(false);
    const consecutivePairs = ref([]);
    const irregularRegions = ref(null);
    const sudokuGrid = ref(null);
    const isGenerating = ref(false);
    
    let timer = null;

    const getVariantType = () => {
      switch (selectedVariant.value) {
        case 'diagonal': return SudokuType.DIAGONAL;
        case 'irregular': return SudokuType.IRREGULAR;
        case 'consecutive': return SudokuType.CONSECUTIVE;
        default: return SudokuType.STANDARD;
      }
    };

    const initializeGame = () => {
      const variant = getVariantType();
      sudokuCore.value = new SudokuCore(variant, 9);
      
      if (selectedVariant.value === 'irregular') {
        irregularRegions.value = sudokuCore.value.generateIrregularRegions();
        sudokuCore.value.setIrregularRegions(irregularRegions.value);
      }
      
      if (selectedVariant.value === 'consecutive') {
        consecutivePairs.value = sudokuCore.value.generateConsecutivePairs();
      }
    };

    const startNewGame = async () => {
      if (isGenerating.value) return;
      
      isGenerating.value = true;
      
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        initializeGame();
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const puzzle = sudokuCore.value.generatePuzzle(
          difficulty.value,
          selectedVariant.value === 'consecutive' ? consecutivePairs.value : null
        );
        
        grid.value = puzzle.puzzle;
        solution.value = puzzle.solution;
        
        fixedCells.value = [];
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (grid.value[row][col] !== 0) {
              fixedCells.value.push(row * 9 + col);
            }
          }
        }
        
        notes.value = createEmptyNotes();
        errors.value = [];
        selectedCell.value = null;
        currentHint.value = null;
        history.value = [];
        isComplete.value = false;
        isSolving.value = false;
        showCelebration.value = false;
        
        resetTimer();
        startTimer();
      } finally {
        isGenerating.value = false;
      }
    };

    const flatGrid = computed(() => {
      const result = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          result.push({
            row,
            col,
            value: grid.value[row][col],
            notes: notes.value[row][col],
            isFixed: fixedCells.value.includes(row * 9 + col),
            isError: errors.value.includes(row * 9 + col)
          });
        }
      }
      return result;
    });

    const getCellClasses = (index) => {
      const row = Math.floor(index / 9);
      const col = index % 9;
      const classes = [];
      
      if (col === 2 || col === 5) {
        classes.push('border-right');
      }
      
      if (row === 2 || row === 5) {
        classes.push('border-bottom');
      }
      
      if (selectedCell.value === index) {
        classes.push('selected');
      }
      
      if (selectedCell.value !== null) {
        const selectedRow = Math.floor(selectedCell.value / 9);
        const selectedCol = selectedCell.value % 9;
        const selectedBox = Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);
        const currentBox = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        
        if (row === selectedRow || col === selectedCol || currentBox === selectedBox) {
          classes.push('highlighted');
        }
        
        if (grid.value[selectedRow][selectedCol] !== 0 && 
            grid.value[row][col] === grid.value[selectedRow][selectedCol]) {
          classes.push('highlighted');
        }
      }
      
      if (errors.value.includes(index)) {
        classes.push('error');
      }
      
      if (fixedCells.value.includes(index)) {
        classes.push('fixed');
      } else if (grid.value[row][col] !== 0) {
        classes.push('user-input');
      }
      
      if (grid.value[row][col] === 0 && notes.value[row][col].length > 0) {
        classes.push('notes');
      }
      
      return classes;
    };

    const selectCell = (index) => {
      if (isComplete.value || isSolving.value) return;
      selectedCell.value = index;
    };

    const inputNumber = (num) => {
      if (selectedCell.value === null || isComplete.value || isSolving.value) return;
      
      const row = Math.floor(selectedCell.value / 9);
      const col = selectedCell.value % 9;
      
      if (fixedCells.value.includes(selectedCell.value)) return;
      
      saveHistory();
      
      if (currentMode.value === 'erase' || num === 0) {
        grid.value[row][col] = 0;
        notes.value[row][col] = [];
        removeError(selectedCell.value);
      } else if (currentMode.value === 'note') {
        if (grid.value[row][col] === 0) {
          const noteIndex = notes.value[row][col].indexOf(num);
          if (noteIndex === -1) {
            notes.value[row][col].push(num);
            notes.value[row][col].sort();
          } else {
            notes.value[row][col].splice(noteIndex, 1);
          }
        }
      } else {
        grid.value[row][col] = num;
        notes.value[row][col] = [];
        
        if (num !== solution.value[row][col]) {
          addError(selectedCell.value);
        } else {
          removeError(selectedCell.value);
          checkCompletion();
        }
      }
    };

    const saveHistory = () => {
      history.value.push({
        grid: grid.value.map(row => [...row]),
        notes: notes.value.map(row => row.map(cell => [...cell])),
        errors: [...errors.value]
      });
      
      if (history.value.length > 50) {
        history.value.shift();
      }
    };

    const undo = () => {
      if (history.value.length === 0) return;
      
      const lastState = history.value.pop();
      grid.value = lastState.grid;
      notes.value = lastState.notes;
      errors.value = lastState.errors;
    };

    const addError = (index) => {
      if (!errors.value.includes(index)) {
        errors.value.push(index);
      }
    };

    const removeError = (index) => {
      const errorIndex = errors.value.indexOf(index);
      if (errorIndex !== -1) {
        errors.value.splice(errorIndex, 1);
      }
    };

    const checkAnswer = () => {
      errors.value = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid.value[row][col] !== 0 && grid.value[row][col] !== solution.value[row][col]) {
            errors.value.push(row * 9 + col);
          }
        }
      }
      
      if (errors.value.length === 0) {
        checkCompletion();
      }
    };

    const checkCompletion = () => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid.value[row][col] === 0 || grid.value[row][col] !== solution.value[row][col]) {
            return;
          }
        }
      }
      
      isComplete.value = true;
      stopTimer();
      showCelebration.value = true;
    };

    const clearUserInputs = () => {
      saveHistory();
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!fixedCells.value.includes(row * 9 + col)) {
            grid.value[row][col] = 0;
            notes.value[row][col] = [];
          }
        }
      }
      errors.value = [];
    };

    const setMode = (mode) => {
      currentMode.value = mode;
    };

    const getModeClass = () => {
      switch (currentMode.value) {
        case 'erase': return 'mode-erase';
        case 'note': return 'mode-note';
        default: return 'mode-normal';
      }
    };

    const getModeName = () => {
      switch (currentMode.value) {
        case 'erase': return '🗑️ 擦除模式';
        case 'note': return '📝 笔记模式';
        default: return '✏️ 输入模式';
      }
    };

    const getVariantName = () => {
      switch (selectedVariant.value) {
        case 'diagonal': return '对角线数独';
        case 'irregular': return '不规则数独';
        case 'consecutive': return '连续数独';
        default: return '标准数独';
      }
    };

    const getVariantDescription = () => {
      switch (selectedVariant.value) {
        case 'diagonal':
          return '除了标准规则外，两条对角线也必须包含1-9的不重复数字。';
        case 'irregular':
          return '宫格不再是3x3的正方形，而是不规则的形状。行、列和不规则宫格都必须包含1-9的不重复数字。';
        case 'consecutive':
          return '没有标记的相邻格子数字不能连续（差不能为1），有标记的格子则无此限制。';
        default:
          return '';
      }
    };

    const getHintTypeText = () => {
      if (!currentHint.value) return '';
      
      switch (currentHint.value.type) {
        case 'naked_single': return '唯一候选数';
        case 'hidden_single': return '隐藏唯一';
        case 'naked_pair': return '显性数对';
        case 'hidden_pair': return '隐性数对';
        case 'pointing_pair': return '指向排除';
        case 'box_line_reduction': return '区块排除';
        case 'forced': return '强制填入';
        default: return '提示';
      }
    };

    const getHint = () => {
      if (isComplete.value || isSolving.value) return;
      
      const hint = sudokuCore.value.getHintStep(
        grid.value,
        solution.value,
        selectedVariant.value === 'consecutive' ? consecutivePairs.value : null
      );
      
      if (hint) {
        currentHint.value = hint;
        hintsUsed.value++;
        selectedCell.value = hint.row * 9 + hint.col;
      }
    };

    const solveStep = () => {
      if (isComplete.value || isSolving.value) return;
      
      const hint = sudokuCore.value.getHintStep(
        grid.value,
        solution.value,
        selectedVariant.value === 'consecutive' ? consecutivePairs.value : null
      );
      
      if (hint && hint.type !== 'naked_pair' && hint.type !== 'hidden_pair') {
        saveHistory();
        grid.value[hint.row][hint.col] = hint.value;
        notes.value[hint.row][hint.col] = [];
        removeError(hint.row * 9 + hint.col);
        currentHint.value = hint;
        selectedCell.value = hint.row * 9 + hint.col;
        checkCompletion();
      }
    };

    const autoSolve = () => {
      if (isComplete.value || isSolving.value) return;
      
      isSolving.value = true;
      
      const solve = () => {
        if (isComplete.value) {
          isSolving.value = false;
          return;
        }
        
        const hint = sudokuCore.value.getHintStep(
          grid.value,
          solution.value,
          selectedVariant.value === 'consecutive' ? consecutivePairs.value : null
        );
        
        if (hint && hint.type !== 'naked_pair' && hint.type !== 'hidden_pair') {
          grid.value[hint.row][hint.col] = hint.value;
          notes.value[hint.row][hint.col] = [];
          removeError(hint.row * 9 + hint.col);
          currentHint.value = hint;
          selectedCell.value = hint.row * 9 + hint.col;
          checkCompletion();
          
          setTimeout(solve, 300);
        } else {
          isSolving.value = false;
        }
      };
      
      solve();
    };

    const startTimer = () => {
      timer = setInterval(() => {
        elapsedTime.value++;
      }, 1000);
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const resetTimer = () => {
      stopTimer();
      elapsedTime.value = 0;
    };

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleKeyDown = (e) => {
      if (isComplete.value || isSolving.value) return;
      
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        inputNumber(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        inputNumber(0);
      } else if (e.key === 'Escape') {
        selectedCell.value = null;
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        undo();
      } else if (selectedCell.value !== null) {
        const row = Math.floor(selectedCell.value / 9);
        const col = selectedCell.value % 9;
        
        if (e.key === 'ArrowUp' && row > 0) {
          selectedCell.value = (row - 1) * 9 + col;
        } else if (e.key === 'ArrowDown' && row < 8) {
          selectedCell.value = (row + 1) * 9 + col;
        } else if (e.key === 'ArrowLeft' && col > 0) {
          selectedCell.value = row * 9 + (col - 1);
        } else if (e.key === 'ArrowRight' && col < 8) {
          selectedCell.value = row * 9 + (col + 1);
        }
      }
    };

    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
      startNewGame();
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
      stopTimer();
    });

    return {
      grid,
      solution,
      fixedCells,
      notes,
      errors,
      selectedCell,
      difficulty,
      selectedVariant,
      currentMode,
      elapsedTime,
      hintsUsed,
      currentHint,
      history,
      isComplete,
      isSolving,
      showCelebration,
      consecutivePairs,
      irregularRegions,
      sudokuGrid,
      isGenerating,
      flatGrid,
      getCellClasses,
      selectCell,
      inputNumber,
      undo,
      checkAnswer,
      clearUserInputs,
      setMode,
      getModeClass,
      getModeName,
      getVariantName,
      getVariantDescription,
      getHintTypeText,
      getHint,
      solveStep,
      autoSolve,
      startNewGame,
      formatTime
    };
  }
};
</script>

<style scoped>
/* 组件样式已在全局 style.css 中定义 */
</style>
