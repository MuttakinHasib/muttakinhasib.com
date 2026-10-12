'use client';

import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  type Edge,
  Handle,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useElementWidth } from '@/lib/use-element-width';
import { HtmlIcon as Icon } from '../visuals/editor-icons';
import { Lucide } from '../visuals/lucide-icons';
import { DemoFrame } from './demo-frame';
import {
  ColumnKey,
  foreignKeys,
  joinQuery,
  type LayoutOptions,
  layoutSchema,
  relationships,
  type SchemaTable,
  searchSchema,
  todoSchema,
} from './schema-model';

/**
 * My own take on the Database Explorer's schema view: the same layered ER
 * diagram, laid out left to right for a wide canvas, plus tracing a table's
 * foreign keys in both directions, search across tables and columns,
 * re-running the layout after a drag, and the join query that follows the keys.
 */

const Role = {
  FOCUS: 'focus',
  REFERENCES: 'references',
  REFERENCED_BY: 'referenced-by',
  MATCH: 'match',
  DIM: 'dim',
} as const;
type Role = (typeof Role)[keyof typeof Role];

interface TableData extends Record<string, unknown> {
  table: SchemaTable;
  role: Role | null;
  /** Matching column names when a search is active. */
  matches: readonly string[];
  /** Name only, layers top to bottom, on a narrow canvas; the panel keeps the columns and keys. */
  compact: boolean;
}

type TableNode = Node<TableData, 'table'>;

const LAYOUT: LayoutOptions = { nodeWidth: 210, headerHeight: 44, rowHeight: 26, gapX: 80, gapY: 36 };
const COMPACT_LAYOUT: LayoutOptions = { nodeWidth: 164, headerHeight: 44, rowHeight: 0, gapX: 40, gapY: 16, vertical: true };
const NARROW_CANVAS = 640;
/** Leaves room at the top for the floating search bar, so no table sits under it. */
const FIT = { padding: { top: '72px', right: '6%', bottom: '6%', left: '6%' } } as const;

function TableNodeView({ data, selected }: NodeProps<TableNode>) {
  const { table, role, matches, compact } = data;
  if (compact) {
    return (
      <div className="sx-node" data-role={role ?? undefined} data-selected={selected || undefined} data-compact>
        <Handle type="target" position={Position.Top} id="in" className="sx-handle sx-handle-pk" isConnectable={false} />
        <div className="sx-head">
          <Icon glyph={Lucide.TABLE} className="sx-icon" />
          <span className="sx-name">{table.name}</span>
          <span className="sx-count">{table.columns.length} cols</span>
        </div>
        <Handle type="source" position={Position.Bottom} id="out" className="sx-handle sx-handle-fk" isConnectable={false} />
      </div>
    );
  }
  return (
    <div className="sx-node" data-role={role ?? undefined} data-selected={selected || undefined}>
      <div className="sx-head">
        <Icon glyph={Lucide.TABLE} className="sx-icon" />
        <span className="sx-name">{table.name}</span>
        <span className="sx-count">public</span>
      </div>
      <ul className="sx-columns">
        {table.columns.map((column) => (
          <li key={column.name} className="sx-column" data-key={column.key} data-match={matches.includes(column.name) || undefined}>
            {column.key === ColumnKey.PRIMARY ? (
              <Handle type="target" position={Position.Left} id={column.name} className="sx-handle sx-handle-pk" isConnectable={false} />
            ) : null}
            {column.key === ColumnKey.FOREIGN ? (
              <Handle type="source" position={Position.Right} id={column.name} className="sx-handle sx-handle-fk" isConnectable={false} />
            ) : null}
            <span className="sx-key" aria-hidden="true">
              {column.key === ColumnKey.PRIMARY ? <Icon glyph={Lucide.KEY} className="sx-icon-sm" /> : null}
              {column.key === ColumnKey.FOREIGN ? <Icon glyph={Lucide.LINK} className="sx-icon-sm" /> : null}
            </span>
            <span className="sx-column-name">{column.name}</span>
            <span className="sx-type">{column.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const nodeTypes = { table: TableNodeView };

function initialNodes(compact: boolean): TableNode[] {
  const positions = layoutSchema(todoSchema, compact ? COMPACT_LAYOUT : LAYOUT);
  return todoSchema.map((table) => ({
    id: table.name,
    type: 'table',
    position: positions.get(table.name) ?? { x: 0, y: 0 },
    data: { table, role: null, matches: [], compact },
  }));
}

export default function SchemaDemo() {
  const [nodes, setNodes] = useState<TableNode[]>(() => initialNodes(false));
  const [focus, setFocus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [flow, setFlow] = useState<ReactFlowInstance<TableNode> | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fitFrame = useRef(0);
  const canvasWidth = useElementWidth(canvasRef);
  const compact = canvasWidth > 0 && canvasWidth < NARROW_CANVAS;

  // Re-lay out when the canvas crosses between wide and narrow (adjusting state during render, not in an effect)...
  const [arranged, setArranged] = useState(compact);
  if (arranged !== compact) {
    setArranged(compact);
    setNodes(initialNodes(compact));
  }

  // ...then frame the diagram again once React Flow has the new positions.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => flow?.fitView(FIT));
    return () => window.cancelAnimationFrame(frame);
  }, [arranged, flow]);

  // Navigating away must not leave Organize's refit running on a dead instance.
  useEffect(
    () => () => {
      window.cancelAnimationFrame(fitFrame.current);
    },
    [],
  );

  const keys = useMemo(() => foreignKeys(todoSchema), []);
  const related = useMemo(() => (focus ? relationships(todoSchema, focus) : null), [focus]);
  const search = useMemo(() => searchSchema(todoSchema, query), [query]);
  const searching = query.trim().length > 0;

  const roleFor = useCallback(
    (name: string): Role | null => {
      if (focus && related) {
        if (name === focus) return Role.FOCUS;
        if (related.references.includes(name)) return Role.REFERENCES;
        if (related.referencedBy.includes(name)) return Role.REFERENCED_BY;
        return Role.DIM;
      }
      if (searching) return search.tables.has(name) ? Role.MATCH : Role.DIM;
      return null;
    },
    [focus, related, search, searching],
  );

  const viewNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          compact,
          role: roleFor(node.id),
          matches: searching
            ? node.data.table.columns.filter((column) => search.columns.has(`${node.id}.${column.name}`)).map((column) => column.name)
            : [],
        },
      })),
    [nodes, roleFor, search, searching, compact],
  );

  const edges = useMemo<Edge[]>(
    () =>
      keys.map((key) => {
        const tone =
          focus === key.table
            ? 'sx-edge-references'
            : focus === key.references.table
              ? 'sx-edge-referenced'
              : focus || (searching && !(search.tables.has(key.table) && search.tables.has(key.references.table)))
                ? 'sx-edge-dim'
                : '';
        return {
          id: `${key.table}.${key.column}`,
          source: key.table,
          sourceHandle: compact ? 'out' : key.column,
          target: key.references.table,
          targetHandle: compact ? 'in' : key.references.column,
          animated: true,
          selectable: false,
          className: `sx-edge ${tone}`,
        };
      }),
    [keys, focus, search, searching, compact],
  );

  const onNodesChange = useCallback((changes: NodeChange<TableNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const toggle = (name: string) => setFocus((current) => (current === name ? null : name));

  const organize = () => {
    setNodes(initialNodes(compact));
    window.cancelAnimationFrame(fitFrame.current);
    fitFrame.current = window.requestAnimationFrame(() => flow?.fitView({ ...FIT, duration: 300 }));
  };

  const table = focus ? todoSchema.find((candidate) => candidate.name === focus) : undefined;
  const list = (names: readonly string[]) => (names.length > 0 ? names.join(', ') : 'none');

  return (
    <DemoFrame
      title="Try the schema"
      instructions="Click a table, or pick one from the list, to trace its foreign keys: blue for the tables it references, amber for the tables that reference it, the rest dims. Search tables or columns, drag tables around, then Organize to lay them out again."
      note="My own take on the Database Explorer’s schema view, rebuilt for this portfolio. The layering follows the rule cocoding.ai’s ELK layout uses, turned left to right so every edge runs straight into the key it references; tracing, search highlighting, and the join query are additions."
    >
      <div className="sx-layout">
        <div className="sx-canvas" ref={canvasRef} data-compact={compact || undefined}>
          <div className="sx-toolbar">
            <label className="sx-search">
              <Icon glyph={Lucide.SEARCH} className="sx-icon" />
              <span className="sr-only">Search tables or columns</span>
              <input
                type="search"
                value={query}
                placeholder="Search schema…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button type="button" className="sx-organize" onClick={organize}>
              <Icon glyph={Lucide.WORKFLOW} className="sx-icon" />
              <span className="sx-organize-label">Organize</span>
            </button>
          </div>
          <ReactFlow
            nodes={viewNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeClick={(_, node) => toggle(node.id)}
            onPaneClick={() => setFocus(null)}
            onInit={setFlow}
            fitView
            fitViewOptions={FIT}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            nodesConnectable={false}
            minZoom={0.2}
            maxZoom={1.4}
            aria-label="Schema diagram"
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="rgba(244,241,232,0.1)" />
          </ReactFlow>
        </div>

        <div className="sx-panel">
          <fieldset className="sx-tables">
            <legend className="type-small font-[600]">Tables</legend>
            <div className="mt-2 grid gap-1">
              {todoSchema.map((candidate) => (
                <button
                  key={candidate.name}
                  type="button"
                  className="sx-table-button"
                  aria-pressed={focus === candidate.name}
                  data-role={roleFor(candidate.name) ?? undefined}
                  onClick={() => toggle(candidate.name)}
                >
                  <span>{candidate.name}</span>
                  <span className="type-mono text-graphite">{candidate.columns.length} columns</span>
                </button>
              ))}
            </div>
          </fieldset>

          <dl className="sx-relations" aria-live="polite">
            <div>
              <dt>Table</dt>
              <dd>{focus ?? (searching ? `${search.tables.size} ${search.tables.size === 1 ? 'table matches' : 'tables match'} “${query.trim()}”` : 'none picked')}</dd>
            </div>
            <div data-role="references">
              <dt>References</dt>
              <dd>{related ? list(related.references) : '—'}</dd>
            </div>
            <div data-role="referenced-by">
              <dt>Referenced by</dt>
              <dd>{related ? list(related.referencedBy) : '—'}</dd>
            </div>
            <div>
              <dt>Keys</dt>
              <dd>
                {table
                  ? table.columns
                      .filter((column) => column.key)
                      .map((column) => `${column.name} (${column.key === ColumnKey.PRIMARY ? 'primary' : 'foreign'})`)
                      .join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>

          <div className="sx-query">
            <p className="type-mono text-graphite">the query it would write</p>
            {focus ? (
              <pre>
                <code>{joinQuery(todoSchema, focus)}</code>
              </pre>
            ) : (
              <p className="type-small text-graphite">Pick a table to get a query that joins along its foreign keys.</p>
            )}
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
