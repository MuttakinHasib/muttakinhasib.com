/**
 * A small relational schema and the rules the schema demo runs on: a layered
 * layout (tables that hold foreign keys come before the tables they reference,
 * as in the ELK layout cocoding.ai uses, here running left to right so every
 * key's edge runs straight into the key it references), the relationships
 * around a focused table, search over tables and columns, and the join query
 * that follows a table's foreign keys.
 */

export const ColumnKey = {
  PRIMARY: 'primary',
  FOREIGN: 'foreign',
} as const;
export type ColumnKey = (typeof ColumnKey)[keyof typeof ColumnKey];

export interface ColumnReference {
  table: string;
  column: string;
}

export interface SchemaColumn {
  name: string;
  type: string;
  key?: ColumnKey;
  references?: ColumnReference;
}

export interface SchemaTable {
  name: string;
  columns: readonly SchemaColumn[];
}

export interface ForeignKey {
  table: string;
  column: string;
  references: ColumnReference;
}

export interface LayoutOptions {
  nodeWidth: number;
  headerHeight: number;
  rowHeight: number;
  /** Space between layers. */
  gapX: number;
  /** Space between tables in a layer. */
  gapY: number;
  /** Layers run top to bottom, tables in a layer side by side, for narrow canvases. */
  vertical?: boolean;
}

export interface TablePosition {
  x: number;
  y: number;
  layer: number;
}

export interface Relationships {
  references: string[];
  referencedBy: string[];
}

export interface SearchResult {
  tables: Set<string>;
  /** Matching columns as `table.column`. */
  columns: Set<string>;
}

interface LayerRequest {
  tables: readonly SchemaTable[];
  keys: readonly ForeignKey[];
}

export const todoSchema: SchemaTable[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
      { name: 'email', type: 'text' },
      { name: 'name', type: 'text' },
    ],
  },
  {
    name: 'sessions',
    columns: [
      { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
      { name: 'user_id', type: 'uuid', key: ColumnKey.FOREIGN, references: { table: 'users', column: 'id' } },
      { name: 'expires_at', type: 'timestamp' },
    ],
  },
  {
    name: 'lists',
    columns: [
      { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
      { name: 'user_id', type: 'uuid', key: ColumnKey.FOREIGN, references: { table: 'users', column: 'id' } },
      { name: 'name', type: 'text' },
    ],
  },
  {
    name: 'todos',
    columns: [
      { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
      { name: 'list_id', type: 'uuid', key: ColumnKey.FOREIGN, references: { table: 'lists', column: 'id' } },
      { name: 'title', type: 'text' },
      { name: 'done', type: 'boolean' },
    ],
  },
  {
    name: 'tags',
    columns: [
      { name: 'id', type: 'uuid', key: ColumnKey.PRIMARY },
      { name: 'name', type: 'text' },
    ],
  },
  {
    name: 'todo_tags',
    columns: [
      { name: 'todo_id', type: 'uuid', key: ColumnKey.FOREIGN, references: { table: 'todos', column: 'id' } },
      { name: 'tag_id', type: 'uuid', key: ColumnKey.FOREIGN, references: { table: 'tags', column: 'id' } },
    ],
  },
];

export function foreignKeys(tables: readonly SchemaTable[]): ForeignKey[] {
  return tables.flatMap((table) =>
    table.columns.flatMap((column) =>
      column.references ? [{ table: table.name, column: column.name, references: column.references }] : [],
    ),
  );
}

/**
 * Layer index per table, in reading order. A table sits one layer before the
 * deepest table it references, so every foreign key points forward; tables
 * that reference nothing then move up to just after their nearest referencer.
 */
export function layers({ tables, keys }: LayerRequest): Map<string, number> {
  const depth = new Map<string, number>();
  const visit = (name: string, trail: Set<string>): number => {
    const known = depth.get(name);
    if (known !== undefined) return known;
    if (trail.has(name)) return 0;
    trail.add(name);
    const below = keys.filter((key) => key.table === name && key.references.table !== name);
    const value = below.length === 0 ? 0 : 1 + Math.max(...below.map((key) => visit(key.references.table, trail)));
    trail.delete(name);
    depth.set(name, value);
    return value;
  };
  for (const table of tables) visit(table.name, new Set());

  const maxDepth = Math.max(0, ...depth.values());
  const layer = new Map(tables.map((table) => [table.name, maxDepth - (depth.get(table.name) ?? 0)]));
  for (const table of tables) {
    if (depth.get(table.name) !== 0) continue;
    const referencers = keys.filter((key) => key.references.table === table.name && key.table !== table.name);
    if (referencers.length === 0) continue;
    layer.set(table.name, Math.max(...referencers.map((key) => layer.get(key.table) ?? 0)) + 1);
  }
  return layer;
}

export function tableHeight(table: SchemaTable, options: LayoutOptions): number {
  return options.headerHeight + table.columns.length * options.rowHeight + 8;
}

/**
 * Positions for the layered layout: one column per layer, left to right (or
 * one row per layer, top to bottom, when `vertical`).
 * Within a column, tables are ordered by the average slot of the tables they
 * connect to in earlier columns, so edges cross as little as this small graph
 * allows, and each column is centred on the same line.
 */
export function layoutSchema(tables: readonly SchemaTable[], options: LayoutOptions): Map<string, TablePosition> {
  const keys = foreignKeys(tables);
  const layerOf = layers({ tables, keys });
  const count = Math.max(0, ...layerOf.values()) + 1;
  const columns: SchemaTable[][] = Array.from({ length: count }, () => []);
  for (const table of tables) columns[layerOf.get(table.name) ?? 0]?.push(table);

  const slotOf = new Map<string, number>();
  const degree = (name: string) => keys.filter((key) => key.table === name || key.references.table === name).length;
  columns.forEach((column, index) => {
    const centre = (name: string) => {
      const before = keys
        .flatMap((key) => (key.table === name ? [key.references.table] : key.references.table === name ? [key.table] : []))
        .filter((other) => (layerOf.get(other) ?? 0) < index && slotOf.has(other));
      return before.length === 0 ? Number.POSITIVE_INFINITY : before.reduce((sum, other) => sum + (slotOf.get(other) ?? 0), 0) / before.length;
    };
    column.sort((a, b) => centre(a.name) - centre(b.name) || degree(b.name) - degree(a.name) || a.name.localeCompare(b.name));
    column.forEach((table, slot) => slotOf.set(table.name, slot - (column.length - 1) / 2));
  });

  const positions = new Map<string, TablePosition>();
  if (options.vertical) {
    let y = 0;
    columns.forEach((column, index) => {
      const total = column.length * options.nodeWidth + options.gapY * Math.max(0, column.length - 1);
      column.forEach((table, slot) => {
        positions.set(table.name, { x: -total / 2 + slot * (options.nodeWidth + options.gapY), y, layer: index });
      });
      y += Math.max(0, ...column.map((table) => tableHeight(table, options))) + options.gapX;
    });
    return positions;
  }
  columns.forEach((column, index) => {
    const heights = column.map((table) => tableHeight(table, options));
    const total = heights.reduce((sum, height) => sum + height, 0) + options.gapY * Math.max(0, column.length - 1);
    let y = -total / 2;
    column.forEach((table, slot) => {
      positions.set(table.name, { x: index * (options.nodeWidth + options.gapX), y, layer: index });
      y += (heights[slot] ?? 0) + options.gapY;
    });
  });
  return positions;
}

export function relationships(tables: readonly SchemaTable[], focus: string): Relationships {
  const keys = foreignKeys(tables);
  const unique = (names: string[]) => [...new Set(names)].sort();
  return {
    references: unique(keys.filter((key) => key.table === focus).map((key) => key.references.table)),
    referencedBy: unique(keys.filter((key) => key.references.table === focus).map((key) => key.table)),
  };
}

export function searchSchema(tables: readonly SchemaTable[], query: string): SearchResult {
  const needle = query.trim().toLowerCase();
  const result: SearchResult = { tables: new Set(), columns: new Set() };
  if (!needle) return result;
  for (const table of tables) {
    if (table.name.toLowerCase().includes(needle)) result.tables.add(table.name);
    for (const column of table.columns) {
      if (column.name.toLowerCase().includes(needle)) {
        result.tables.add(table.name);
        result.columns.add(`${table.name}.${column.name}`);
      }
    }
  }
  return result;
}

/** The column that best names a row: the first text column that is not a key. */
function labelColumn(table: SchemaTable | undefined): string | undefined {
  return table?.columns.find((column) => column.type === 'text' && !column.key)?.name;
}

/**
 * A query that reads the focused table through its foreign keys: one JOIN per
 * key, selecting the referenced table's label column next to the table's own.
 */
export function joinQuery(tables: readonly SchemaTable[], focus: string): string {
  const table = tables.find((candidate) => candidate.name === focus);
  if (!table) return '';
  const keys = foreignKeys(tables).filter((key) => key.table === focus);
  if (keys.length === 0) return `SELECT *\nFROM ${focus}\nLIMIT 10;`;

  const own = table.columns.filter((column) => !column.key).map((column) => `${focus}.${column.name}`);
  const joined = keys.flatMap((key) => {
    const label = labelColumn(tables.find((candidate) => candidate.name === key.references.table));
    return label ? [`${key.references.table}.${label} AS ${key.column.replace(/_id$/, '')}_${label}`] : [];
  });
  const select = [...own, ...joined].join(',\n       ');
  const joins = keys
    .map((key) => `JOIN ${key.references.table} ON ${key.references.table}.${key.references.column} = ${focus}.${key.column}`)
    .join('\n');
  return `SELECT ${select}\nFROM ${focus}\n${joins}\nLIMIT 10;`;
}
