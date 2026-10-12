import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  foreignKeys,
  joinQuery,
  layers,
  layoutSchema,
  relationships,
  searchSchema,
  todoSchema,
} from '../components/demos/schema-model.ts';

const options = { nodeWidth: 220, headerHeight: 44, rowHeight: 26, gapX: 90, gapY: 40 };

describe('layers', () => {
  it('puts every table before the tables it references', () => {
    const keys = foreignKeys(todoSchema);
    const layerOf = layers({ tables: todoSchema, keys });
    for (const key of keys) {
      assert.ok((layerOf.get(key.table) ?? 0) < (layerOf.get(key.references.table) ?? 0), `${key.table} → ${key.references.table}`);
    }
  });

  it('moves a referenced-only table to just after its nearest referencer', () => {
    const layerOf = layers({ tables: todoSchema, keys: foreignKeys(todoSchema) });
    assert.equal(layerOf.get('todo_tags'), 0);
    assert.equal(layerOf.get('tags'), 1);
    assert.equal(layerOf.get('users'), 3);
  });
});

describe('layoutSchema', () => {
  it('places layers left to right without overlapping tables in a column', () => {
    const positions = layoutSchema(todoSchema, options);
    assert.ok((positions.get('todo_tags')?.x ?? 0) < (positions.get('todos')?.x ?? 0));
    assert.ok((positions.get('todos')?.x ?? 0) < (positions.get('lists')?.x ?? 0));
    const lists = positions.get('lists');
    const sessions = positions.get('sessions');
    assert.ok(lists && sessions && lists.x === sessions.x && Math.abs(lists.y - sessions.y) >= options.headerHeight);
  });

  it('runs layers top to bottom with a layer side by side when vertical', () => {
    const positions = layoutSchema(todoSchema, { ...options, vertical: true });
    const y = (name: string) => positions.get(name)?.y ?? 0;
    assert.ok(y('todo_tags') < y('todos') && y('todos') < y('lists') && y('lists') < y('users'));
    assert.equal(y('lists'), y('sessions'));
    assert.ok((positions.get('lists')?.x ?? 0) + options.nodeWidth <= (positions.get('sessions')?.x ?? 0));
  });

  it('orders a column by the tables before it', () => {
    const positions = layoutSchema(todoSchema, options);
    assert.ok((positions.get('lists')?.y ?? 0) < (positions.get('sessions')?.y ?? 0));
    assert.ok((positions.get('todos')?.y ?? 0) < (positions.get('tags')?.y ?? 0));
  });
});

describe('relationships', () => {
  it('lists what a table references and what references it', () => {
    assert.deepEqual(relationships(todoSchema, 'todos'), { references: ['lists'], referencedBy: ['todo_tags'] });
    assert.deepEqual(relationships(todoSchema, 'users'), { references: [], referencedBy: ['lists', 'sessions'] });
  });
});

describe('searchSchema', () => {
  it('matches table and column names, case-insensitively', () => {
    const result = searchSchema(todoSchema, 'USER');
    assert.deepEqual([...result.tables].sort(), ['lists', 'sessions', 'users']);
    assert.ok(result.columns.has('lists.user_id'));
  });

  it('matches nothing for an empty query', () => {
    assert.equal(searchSchema(todoSchema, '  ').tables.size, 0);
  });
});

describe('joinQuery', () => {
  it('joins each foreign key and selects the referenced label column', () => {
    assert.equal(
      joinQuery(todoSchema, 'todos'),
      'SELECT todos.title,\n       todos.done,\n       lists.name AS list_name\nFROM todos\nJOIN lists ON lists.id = todos.list_id\nLIMIT 10;',
    );
  });

  it('joins both sides of a link table', () => {
    const sql = joinQuery(todoSchema, 'todo_tags');
    assert.match(sql, /JOIN todos ON todos\.id = todo_tags\.todo_id/);
    assert.match(sql, /JOIN tags ON tags\.id = todo_tags\.tag_id/);
  });

  it('reads a table without foreign keys directly', () => {
    assert.equal(joinQuery(todoSchema, 'users'), 'SELECT *\nFROM users\nLIMIT 10;');
  });
});
