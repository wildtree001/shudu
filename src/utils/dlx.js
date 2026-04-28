class DLXNode {
  constructor(id = null, rowData = null) {
    this.id = id;
    this.rowData = rowData;
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = null;
  }
}

class DLXColumn extends DLXNode {
  constructor(name) {
    super(name);
    this.size = 0;
  }
}

class DLX {
  constructor() {
    this.header = new DLXNode();
    this.columns = [];
    this.solution = [];
    this.solutions = [];
    this.maxSolutions = 1;
  }

  addColumn(name) {
    const column = new DLXColumn(name);
    this.columns.push(column);
    
    const last = this.header.left;
    last.right = column;
    column.left = last;
    column.right = this.header;
    this.header.left = column;
    
    return column;
  }

  addRow(columnNames, rowData = null) {
    let first = null;
    for (const name of columnNames) {
      const column = this.columns.find(col => col.name === name);
      if (!column) continue;
      
      const node = new DLXNode(null, rowData);
      node.column = column;
      
      const last = column.up;
      last.down = node;
      node.up = last;
      node.down = column;
      column.up = node;
      
      column.size++;
      
      if (!first) {
        first = node;
      } else {
        const lastInRow = first.left;
        lastInRow.right = node;
        node.left = lastInRow;
        node.right = first;
        first.left = node;
      }
    }
    return first;
  }

  cover(column) {
    column.right.left = column.left;
    column.left.right = column.right;
    
    for (let row = column.down; row !== column; row = row.down) {
      for (let node = row.right; node !== row; node = node.right) {
        node.down.up = node.up;
        node.up.down = node.down;
        node.column.size--;
      }
    }
  }

  uncover(column) {
    for (let row = column.up; row !== column; row = row.up) {
      for (let node = row.left; node !== row; node = node.left) {
        node.column.size++;
        node.down.up = node;
        node.up.down = node;
      }
    }
    
    column.right.left = column;
    column.left.right = column;
  }

  selectMinColumn() {
    let minSize = Infinity;
    let selected = null;
    
    for (let column = this.header.right; column !== this.header; column = column.right) {
      if (column.size < minSize) {
        minSize = column.size;
        selected = column;
        if (minSize === 0) break;
      }
    }
    
    return selected;
  }

  search(k = 0) {
    if (this.header.right === this.header) {
      this.solutions.push([...this.solution]);
      return this.solutions.length >= this.maxSolutions;
    }
    
    const column = this.selectMinColumn();
    if (!column || column.size === 0) return false;
    
    this.cover(column);
    
    for (let row = column.down; row !== column; row = row.down) {
      this.solution.push(row);
      
      for (let node = row.right; node !== row; node = node.right) {
        this.cover(node.column);
      }
      
      if (this.search(k + 1)) {
        return true;
      }
      
      this.solution.pop();
      
      for (let node = row.left; node !== row; node = node.left) {
        this.uncover(node.column);
      }
    }
    
    this.uncover(column);
    return false;
  }

  solve(maxSolutions = 1) {
    this.solution = [];
    this.solutions = [];
    this.maxSolutions = maxSolutions;
    this.search();
    return this.solutions;
  }
}

export { DLX, DLXNode, DLXColumn };
