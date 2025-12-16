// src/utils/pivotHierarchy.ts

// Use non-printable character as delimiter to avoid conflicts with data
const DELIMITER = "\x1F"; // Unit Separator

export type TreeNode = {
  id: string;
  label: string;
  children: TreeNode[];
  leafCount: number;
  matrixRowIndex?: number;
  matrixColIndex?: number;
};

export function buildHierarchy(keys: string[], delimiter = DELIMITER, isRow = true): TreeNode[] {
  const roots: TreeNode[] = [];
  function findById(list: TreeNode[], id: string): TreeNode | undefined {
    for (const n of list) if (n.id === id) return n;
    return undefined;
  }
  keys.forEach((fullKey, leafIndex) => {
    const safeKey = fullKey ?? "";
    const parts = safeKey === "" ? ["(blank)"] : safeKey.split(delimiter);
    let pathSoFar = "";
    let currentList = roots;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] || "(blank)";
      pathSoFar = pathSoFar ? `${pathSoFar}${delimiter}${part}` : part;
      let node = findById(currentList, pathSoFar);
      if (!node) {
        node = { id: pathSoFar, label: part, children: [], leafCount: 0 };
        currentList.push(node);
      }
      if (i === parts.length - 1) {
        if (isRow) node.matrixRowIndex = leafIndex;
        else node.matrixColIndex = leafIndex;
        node.leafCount = 1;
      }
      currentList = node.children;
    }
  });
  function computeLeafCounts(nodes: TreeNode[]): number {
    let total = 0;
    for (const n of nodes) {
      if (n.children.length === 0) {
        total += n.leafCount || 1;
      } else {
        const childTotal = computeLeafCounts(n.children);
        n.leafCount = childTotal;
        total += childTotal;
      }
    }
    return total;
  }
  computeLeafCounts(roots);
  return roots;
}

export function treeDepth(nodes: TreeNode[]): number {
  let max = 0;
  function dfs(n: TreeNode, level: number) {
    max = Math.max(max, level);
    for (const c of n.children) dfs(c, level + 1);
  }
  for (const r of nodes) dfs(r, 1);
  return max;
}

export type HeaderCell = {
  key: string;
  label: string;
  colspan: number;
  rowspan: number;
};

export function buildHeaderRows(colTree: TreeNode[]): HeaderCell[][] {
  const depth = treeDepth(colTree);
  const rows: HeaderCell[][] = Array.from({ length: depth }, () => []);
  function visit(node: TreeNode, level: number) {
    const isLeaf = node.children.length === 0;
    const colspan = Math.max(1, node.leafCount || 1);
    const rowspan = isLeaf ? depth - level + 1 : 1;
    rows[level - 1].push({ key: node.id, label: node.label, colspan, rowspan });
    for (const c of node.children) visit(c, level + 1);
  }
  for (const root of colTree) visit(root, 1);
  return rows;
}

export function collectColLeaves(colTree: TreeNode[]): number[] {
  const out: number[] = [];
  function dfs(n: TreeNode) {
    if (n.children.length === 0) {
      if (typeof n.matrixColIndex === "number") out.push(n.matrixColIndex);
    } else {
      for (const c of n.children) dfs(c);
    }
  }
  for (const r of colTree) dfs(r);
  return out;
}

export function collectDescendantRowIndices(node: TreeNode): number[] {
  const out: number[] = [];
  function dfs(n: TreeNode) {
    if (n.children.length === 0) {
      if (typeof n.matrixRowIndex === "number") out.push(n.matrixRowIndex);
    } else {
      for (const c of n.children) dfs(c);
    }
  }
  dfs(node);
  return out;
}
