import { DLX } from './dlx.js';

const SudokuType = {
  STANDARD: 'standard',
  DIAGONAL: 'diagonal',
  IRREGULAR: 'irregular',
  CONSECUTIVE: 'consecutive'
};

class SudokuCore {
  constructor(type = SudokuType.STANDARD, size = 9) {
    this.type = type;
    this.size = size;
    this.boxSize = Math.sqrt(size);
    this.irregularRegions = null;
  }

  setIrregularRegions(regions) {
    this.irregularRegions = regions;
  }

  getBox(row, col) {
    if (this.type === SudokuType.IRREGULAR && this.irregularRegions) {
      return this.irregularRegions[row][col];
    }
    return Math.floor(row / this.boxSize) * this.boxSize + Math.floor(col / this.boxSize);
  }

  getBoxCells(boxIndex) {
    const cells = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.getBox(row, col) === boxIndex) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  }

  isOnDiagonal(row, col) {
    return row === col || row + col === this.size - 1;
  }

  isValid(grid, row, col, num, consecutivePairs = null) {
    for (let c = 0; c < this.size; c++) {
      if (grid[row][c] === num) return false;
    }

    for (let r = 0; r < this.size; r++) {
      if (grid[r][col] === num) return false;
    }

    const boxIndex = this.getBox(row, col);
    const boxCells = this.getBoxCells(boxIndex);
    for (const { row: r, col: c } of boxCells) {
      if (grid[r][c] === num) return false;
    }

    if (this.type === SudokuType.DIAGONAL) {
      if (row === col) {
        for (let i = 0; i < this.size; i++) {
          if (grid[i][i] === num) return false;
        }
      }
      if (row + col === this.size - 1) {
        for (let i = 0; i < this.size; i++) {
          if (grid[i][this.size - 1 - i] === num) return false;
        }
      }
    }

    if (this.type === SudokuType.CONSECUTIVE && consecutivePairs) {
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
          const hasBarrier = consecutivePairs.some(pair => 
            ((pair.row1 === row && pair.col1 === col && pair.row2 === nr && pair.col2 === nc) ||
             (pair.row1 === nr && pair.col1 === nc && pair.row2 === row && pair.col2 === col))
          );
          if (!hasBarrier && grid[nr][nc] !== 0) {
            if (Math.abs(num - grid[nr][nc]) === 1) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  getCandidates(grid, row, col, consecutivePairs = null) {
    const candidates = [];
    for (let num = 1; num <= this.size; num++) {
      if (this.isValid(grid, row, col, num, consecutivePairs)) {
        candidates.push(num);
      }
    }
    return candidates;
  }

  createEmptyGrid() {
    return Array(this.size).fill(null).map(() => Array(this.size).fill(0));
  }

  cloneGrid(grid) {
    return grid.map(row => [...row]);
  }

  generateCompleteGrid(consecutivePairs = null) {
    const grid = this.createEmptyGrid();
    this._fillGrid(grid, consecutivePairs);
    return grid;
  }

  _fillGrid(grid, consecutivePairs = null) {
    const emptyCells = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length === 0) return true;

    emptyCells.sort((a, b) => {
      const candidatesA = this.getCandidates(grid, a.row, a.col, consecutivePairs).length;
      const candidatesB = this.getCandidates(grid, b.row, b.col, consecutivePairs).length;
      return candidatesA - candidatesB;
    });

    const { row, col } = emptyCells[0];
    const candidates = this.getCandidates(grid, row, col, consecutivePairs);
    
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    for (const num of candidates) {
      grid[row][col] = num;
      if (this._fillGrid(grid, consecutivePairs)) {
        return true;
      }
      grid[row][col] = 0;
    }

    return false;
  }

  generatePuzzle(difficulty = 'medium', consecutivePairs = null) {
    const completeGrid = this.generateCompleteGrid(consecutivePairs);
    const puzzle = this.cloneGrid(completeGrid);
    
    let cellsToRemove;
    switch (difficulty) {
      case 'easy':
        cellsToRemove = 35;
        break;
      case 'hard':
        cellsToRemove = 50;
        break;
      case 'medium':
      default:
        cellsToRemove = 42;
        break;
    }

    const cells = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        cells.push({ row, col });
      }
    }

    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    let removed = 0;
    let attempts = 0;
    const maxAttempts = 500;

    for (const { row, col } of cells) {
      if (removed >= cellsToRemove || attempts >= maxAttempts) break;
      if (puzzle[row][col] === 0) continue;
      
      const temp = puzzle[row][col];
      puzzle[row][col] = 0;
      attempts++;
      
      const hasUniqueSolution = this._hasUniqueSolution(puzzle, consecutivePairs);
      
      if (hasUniqueSolution) {
        removed++;
      } else {
        puzzle[row][col] = temp;
      }
    }

    return {
      puzzle,
      solution: completeGrid,
      difficulty,
      type: this.type
    };
  }

  _hasUniqueSolution(grid, consecutivePairs = null) {
    let solutionCount = 0;
    const gridCopy = this.cloneGrid(grid);
    
    const solve = () => {
      let minCandidates = Infinity;
      let bestRow = -1;
      let bestCol = -1;
      let bestCandidates = [];

      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (gridCopy[row][col] === 0) {
            const candidates = this.getCandidates(gridCopy, row, col, consecutivePairs);
            if (candidates.length === 0) return false;
            if (candidates.length < minCandidates) {
              minCandidates = candidates.length;
              bestRow = row;
              bestCol = col;
              bestCandidates = candidates;
              if (minCandidates === 1) break;
            }
          }
        }
        if (minCandidates === 1) break;
      }

      if (bestRow === -1) {
        solutionCount++;
        return solutionCount >= 2;
      }

      for (const num of bestCandidates) {
        gridCopy[bestRow][bestCol] = num;
        if (solve()) {
          return true;
        }
        gridCopy[bestRow][bestCol] = 0;
      }

      return false;
    };

    solve();
    return solutionCount === 1;
  }

  solveWithDLX(grid, maxSolutions = 1, consecutivePairs = null) {
    const dlx = new DLX();
    const constraints = this._buildConstraints(grid, consecutivePairs);
    
    for (const constraint of constraints.columns) {
      dlx.addColumn(constraint);
    }
    
    for (const rowData of constraints.rows) {
      dlx.addRow(rowData.constraints, rowData.data);
    }
    
    const solutions = dlx.solve(maxSolutions);
    
    return solutions.map(solution => {
      const result = this.createEmptyGrid();
      for (const node of solution) {
        if (node.rowData) {
          const { row, col, num } = node.rowData;
          result[row][col] = num;
        }
      }
      return result;
    });
  }

  _buildConstraints(grid, consecutivePairs = null) {
    const columns = [];
    const rows = [];

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        columns.push(`cell-${row}-${col}`);
      }
    }

    for (let row = 0; row < this.size; row++) {
      for (let num = 1; num <= this.size; num++) {
        columns.push(`row-${row}-${num}`);
      }
    }

    for (let col = 0; col < this.size; col++) {
      for (let num = 1; num <= this.size; num++) {
        columns.push(`col-${col}-${num}`);
      }
    }

    for (let box = 0; box < this.size; box++) {
      for (let num = 1; num <= this.size; num++) {
        columns.push(`box-${box}-${num}`);
      }
    }

    if (this.type === SudokuType.DIAGONAL) {
      for (let num = 1; num <= this.size; num++) {
        columns.push(`diag1-${num}`);
        columns.push(`diag2-${num}`);
      }
    }

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] !== 0) {
          const num = grid[row][col];
          const box = this.getBox(row, col);
          const constraintList = [
            `cell-${row}-${col}`,
            `row-${row}-${num}`,
            `col-${col}-${num}`,
            `box-${box}-${num}`
          ];
          
          if (this.type === SudokuType.DIAGONAL) {
            if (row === col) constraintList.push(`diag1-${num}`);
            if (row + col === this.size - 1) constraintList.push(`diag2-${num}`);
          }
          
          rows.push({
            constraints: constraintList,
            data: { row, col, num }
          });
        } else {
          for (let num = 1; num <= this.size; num++) {
            if (this.isValid(grid, row, col, num, consecutivePairs)) {
              const box = this.getBox(row, col);
              const constraintList = [
                `cell-${row}-${col}`,
                `row-${row}-${num}`,
                `col-${col}-${num}`,
                `box-${box}-${num}`
              ];
              
              if (this.type === SudokuType.DIAGONAL) {
                if (row === col) constraintList.push(`diag1-${num}`);
                if (row + col === this.size - 1) constraintList.push(`diag2-${num}`);
              }
              
              rows.push({
                constraints: constraintList,
                data: { row, col, num }
              });
            }
          }
        }
      }
    }

    return { columns, rows };
  }

  _decodeRow(columnName) {
    if (columnName.startsWith('cell-')) {
      const parts = columnName.split('-');
      return [parseInt(parts[1]), parseInt(parts[2]), 0];
    }
    return [0, 0, 0];
  }

  solveWithBacktracking(grid, consecutivePairs = null) {
    const result = this.cloneGrid(grid);
    if (this._solveBacktracking(result, consecutivePairs)) {
      return [result];
    }
    return [];
  }

  _solveBacktracking(grid, consecutivePairs = null) {
    let minCandidates = Infinity;
    let bestRow = -1;
    let bestCol = -1;
    let bestCandidates = [];

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          if (candidates.length === 0) return false;
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length;
            bestRow = row;
            bestCol = col;
            bestCandidates = candidates;
            if (minCandidates === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestRow === -1) return true;

    for (const num of bestCandidates) {
      grid[bestRow][bestCol] = num;
      if (this._solveBacktracking(grid, consecutivePairs)) {
        return true;
      }
      grid[bestRow][bestCol] = 0;
    }

    return false;
  }

  countSolutions(grid, maxSolutions = 2, consecutivePairs = null) {
    const gridCopy = this.cloneGrid(grid);
    let count = 0;
    this._countSolutions(gridCopy, maxSolutions, consecutivePairs, () => {
      count++;
      return count >= maxSolutions;
    });
    return count;
  }

  _countSolutions(grid, maxSolutions, consecutivePairs, callback) {
    let minCandidates = Infinity;
    let bestRow = -1;
    let bestCol = -1;
    let bestCandidates = [];

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          if (candidates.length === 0) return false;
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length;
            bestRow = row;
            bestCol = col;
            bestCandidates = candidates;
            if (minCandidates === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (bestRow === -1) {
      return callback();
    }

    for (const num of bestCandidates) {
      grid[bestRow][bestCol] = num;
      if (this._countSolutions(grid, maxSolutions, consecutivePairs, callback)) {
        return true;
      }
      grid[bestRow][bestCol] = 0;
    }

    return false;
  }

  _encodeRow(row, col, num) {
    return {
      cell: `cell-${row}-${col}`,
      rowConstraint: `row-${row}-${num}`,
      colConstraint: `col-${col}-${num}`,
      boxConstraint: `box-${this.getBox(row, col)}-${num}`
    };
  }

  getHintStep(grid, solution, consecutivePairs = null) {
    const steps = [];

    steps.push(...this._findNakedSingles(grid, consecutivePairs));
    steps.push(...this._findHiddenSingles(grid, consecutivePairs));
    steps.push(...this._findNakedPairs(grid, consecutivePairs));
    steps.push(...this._findHiddenPairs(grid, consecutivePairs));
    steps.push(...this._findPointingPairs(grid, consecutivePairs));
    steps.push(...this._findBoxLineReduction(grid, consecutivePairs));

    if (steps.length === 0) {
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (grid[row][col] === 0 && solution[row][col] !== 0) {
            return {
              type: 'forced',
              row,
              col,
              value: solution[row][col],
              description: `在位置 (${row + 1}, ${col + 1}) 填入 ${solution[row][col]}`,
              difficulty: 'advanced'
            };
          }
        }
      }
    }

    if (steps.length > 0) {
      steps.sort((a, b) => {
        const priority = {
          'naked_single': 1,
          'hidden_single': 2,
          'naked_pair': 3,
          'hidden_pair': 4,
          'pointing_pair': 5,
          'box_line_reduction': 6
        };
        return priority[a.type] - priority[b.type];
      });
      return steps[0];
    }

    return null;
  }

  _findNakedSingles(grid, consecutivePairs = null) {
    const steps = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          if (candidates.length === 1) {
            steps.push({
              type: 'naked_single',
              row,
              col,
              value: candidates[0],
              description: `唯一候选数：在位置 (${row + 1}, ${col + 1}) 只有 ${candidates[0]} 一个候选数`,
              difficulty: 'easy'
            });
          }
        }
      }
    }
    return steps;
  }

  _findHiddenSingles(grid, consecutivePairs = null) {
    const steps = [];

    for (let row = 0; row < this.size; row++) {
      const numPositions = {};
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          for (const num of candidates) {
            if (!numPositions[num]) numPositions[num] = [];
            numPositions[num].push(col);
          }
        }
      }
      for (const num in numPositions) {
        if (numPositions[num].length === 1) {
          const col = numPositions[num][0];
          steps.push({
            type: 'hidden_single',
            row,
            col,
            value: parseInt(num),
            description: `隐藏唯一候选数：在第 ${row + 1} 行中，只有位置 (${row + 1}, ${col + 1}) 可以填入 ${num}`,
            difficulty: 'easy'
          });
        }
      }
    }

    for (let col = 0; col < this.size; col++) {
      const numPositions = {};
      for (let row = 0; row < this.size; row++) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          for (const num of candidates) {
            if (!numPositions[num]) numPositions[num] = [];
            numPositions[num].push(row);
          }
        }
      }
      for (const num in numPositions) {
        if (numPositions[num].length === 1) {
          const row = numPositions[num][0];
          steps.push({
            type: 'hidden_single',
            row,
            col,
            value: parseInt(num),
            description: `隐藏唯一候选数：在第 ${col + 1} 列中，只有位置 (${row + 1}, ${col + 1}) 可以填入 ${num}`,
            difficulty: 'easy'
          });
        }
      }
    }

    for (let box = 0; box < this.size; box++) {
      const boxCells = this.getBoxCells(box);
      const numPositions = {};
      for (const { row, col } of boxCells) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          for (const num of candidates) {
            if (!numPositions[num]) numPositions[num] = [];
            numPositions[num].push({ row, col });
          }
        }
      }
      for (const num in numPositions) {
        if (numPositions[num].length === 1) {
          const { row, col } = numPositions[num][0];
          steps.push({
            type: 'hidden_single',
            row,
            col,
            value: parseInt(num),
            description: `隐藏唯一候选数：在第 ${box + 1} 宫中，只有位置 (${row + 1}, ${col + 1}) 可以填入 ${num}`,
            difficulty: 'easy'
          });
        }
      }
    }

    return steps;
  }

  _findNakedPairs(grid, consecutivePairs = null) {
    const steps = [];

    for (let row = 0; row < this.size; row++) {
      const cellCandidates = [];
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === 0) {
          const candidates = this.getCandidates(grid, row, col, consecutivePairs);
          if (candidates.length === 2) {
            cellCandidates.push({ col, candidates: candidates.sort() });
          }
        }
      }

      for (let i = 0; i < cellCandidates.length; i++) {
        for (let j = i + 1; j < cellCandidates.length; j++) {
          const c1 = cellCandidates[i];
          const c2 = cellCandidates[j];
          if (c1.candidates[0] === c2.candidates[0] && c1.candidates[1] === c2.candidates[1]) {
            steps.push({
              type: 'naked_pair',
              row,
              col: c1.col,
              value: c1.candidates[0],
              relatedCells: [{ row, col: c1.col }, { row, col: c2.col }],
              pairValues: c1.candidates,
              description: `显性数对：在第 ${row + 1} 行中，位置 (${row + 1}, ${c1.col + 1}) 和 (${row + 1}, ${c2.col + 1}) 都只有候选数 ${c1.candidates[0]} 和 ${c1.candidates[1]}`,
              difficulty: 'medium'
            });
          }
        }
      }
    }

    return steps;
  }

  _findHiddenPairs(grid, consecutivePairs = null) {
    return [];
  }

  _findPointingPairs(grid, consecutivePairs = null) {
    return [];
  }

  _findBoxLineReduction(grid, consecutivePairs = null) {
    return [];
  }

  solveStepByStep(grid, solution, consecutivePairs = null) {
    const steps = [];
    const currentGrid = this.cloneGrid(grid);
    
    while (true) {
      const step = this.getHintStep(currentGrid, solution, consecutivePairs);
      if (!step) break;
      
      steps.push(step);
      
      if (step.type !== 'naked_pair' && step.type !== 'hidden_pair') {
        currentGrid[step.row][step.col] = step.value;
      }
      
      let isComplete = true;
      for (let row = 0; row < this.size; row++) {
        for (let col = 0; col < this.size; col++) {
          if (currentGrid[row][col] === 0) {
            isComplete = false;
            break;
          }
        }
        if (!isComplete) break;
      }
      
      if (isComplete) break;
    }
    
    return steps;
  }

  generateConsecutivePairs() {
    const pairs = [];
    
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size - 1; col++) {
        if (Math.random() > 0.5) {
          pairs.push({
            row1: row,
            col1: col,
            row2: row,
            col2: col + 1
          });
        }
      }
    }
    
    for (let row = 0; row < this.size - 1; row++) {
      for (let col = 0; col < this.size; col++) {
        if (Math.random() > 0.5) {
          pairs.push({
            row1: row,
            col1: col,
            row2: row + 1,
            col2: col
          });
        }
      }
    }
    
    return pairs;
  }

  generateIrregularRegions() {
    const regions = this.createEmptyGrid();
    const visited = this.createEmptyGrid();
    let regionId = 0;
    
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (!visited[row][col]) {
          const regionCells = [];
          const stack = [{ row, col }];
          
          while (stack.length > 0 && regionCells.length < this.boxSize) {
            const { row: r, col: c } = stack.pop();
            if (visited[r][c]) continue;
            
            visited[r][c] = 1;
            regionCells.push({ row: r, col: c });
            
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !visited[nr][nc]) {
                stack.push({ row: nr, col: nc });
              }
            }
          }
          
          for (const { row: r, col: c } of regionCells) {
            regions[r][c] = regionId;
          }
          regionId++;
        }
      }
    }
    
    return regions;
  }
}

export { SudokuCore, SudokuType };
