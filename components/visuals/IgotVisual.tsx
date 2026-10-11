import { Dots, VizFrame, VizNode, VizState, verticalPath, wirePath } from './primitives';

interface BadgeProps {
  x: number;
  y: number;
  order: number | null;
}

interface AgentNode {
  id: string;
  kicker: string;
  title: string;
  order: number | null;
  x: number;
  y: number;
}

interface OrderListProps {
  x: number;
  y: number;
  rowHeight: number;
  columns?: number;
  columnWidth?: number;
}

const INK = '#171815';
const AGENT = '#b4a2ff';
const GRAPHITE = '#5c5b54';
const NODE_W = 190;
const NODE_H = 84;

const wideNodes: AgentNode[] = [
  { id: 'trigger', kicker: 'trigger', title: 'New message', order: 1, x: 50, y: 300 },
  { id: 'kb', kicker: 'knowledge base', title: 'Policy docs', order: 2, x: 280, y: 170 },
  { id: 'ocr', kicker: 'ocr file', title: 'Read upload', order: 3, x: 280, y: 420 },
  { id: 'llm', kicker: 'llm', title: 'Draft answer', order: 4, x: 510, y: 295 },
  { id: 'follow', kicker: 'follow-up', title: 'Schedule reply', order: 5, x: 740, y: 170 },
  { id: 'telegram', kicker: 'telegram', title: 'Send message', order: 6, x: 740, y: 420 },
];

const wideEdges: [string, string][] = [
  ['trigger', 'kb'],
  ['trigger', 'ocr'],
  ['kb', 'llm'],
  ['ocr', 'llm'],
  ['llm', 'follow'],
  ['llm', 'telegram'],
];

function Badge({ x, y, order }: BadgeProps) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={14}
        fill={order === null ? '#fbfaf6' : AGENT}
        stroke={INK}
        strokeWidth="1.25"
        strokeDasharray={order === null ? '3 3' : undefined}
      />
      <text x={x} y={y + 5} textAnchor="middle" className="v-label" fill={INK}>
        {order ?? '…'}
      </text>
    </g>
  );
}

function OrderList({ x, y, rowHeight, columns = 1, columnWidth = 0 }: OrderListProps) {
  const perColumn = Math.ceil(wideNodes.length / columns);
  return (
    <g>
      {wideNodes.map((node, index) => {
        const column = Math.floor(index / perColumn);
        const row = index % perColumn;
        const left = x + column * columnWidth;
        const top = y + row * rowHeight;
        return (
          <g key={node.id}>
            <Badge x={left + 14} y={top} order={node.order} />
            <text x={left + 40} y={top + 5} className="v-label" fill={INK}>
              {node.title}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Wide() {
  const byId = new Map(wideNodes.map((node) => [node.id, node]));
  return (
    <>
      <Dots width={1200} height={760} color="rgba(23,24,21,0.16)" background="#e9e6dc" />
      {[0, 1, 2, 3].map((layer) => (
        <g key={layer}>
          <line x1={40 + layer * 230} y1={92} x2={40 + layer * 230} y2={700} stroke={INK} strokeDasharray="3 6" opacity="0.25" />
          <text x={50 + layer * 230} y={112} className="v-kicker" fill={GRAPHITE}>
            layer {layer}
          </text>
        </g>
      ))}
      <text x={50} y={64} className="v-kicker" fill={GRAPHITE}>
        auto-layout by dependency depth
      </text>

      {wideEdges.map(([from, to]) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b) return null;
        return (
          <path
            key={`${from}-${to}`}
            d={wirePath({ x: a.x + NODE_W, y: a.y + NODE_H / 2 }, { x: b.x, y: b.y + NODE_H / 2 })}
            fill="none"
            stroke={INK}
            strokeWidth="1.5"
          />
        );
      })}
      <path d={wirePath({ x: 240, y: 342 }, { x: 280, y: 612 })} fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray="5 5" />

      {wideNodes.map((node) => (
        <g key={node.id}>
          <VizNode x={node.x} y={node.y} w={NODE_W} h={NODE_H} kicker={node.kicker} title={node.title} ports={{ in: node.id !== 'trigger', out: true }} />
          <Badge x={node.x + NODE_W - 2} y={node.y} order={node.order} />
        </g>
      ))}
      <VizNode x={280} y={570} w={NODE_W} h={NODE_H} kicker="online search" title="Creating…" state={VizState.PENDING} ports={{ in: true }} />
      <Badge x={280 + NODE_W - 2} y={570} order={null} />
      <text x={280} y={680} className="v-kicker" fill={GRAPHITE}>
        shown now, saved in the background
      </text>

      {/* Backend execution order, kept in sync with the edges */}
      <rect x={964} y={92} width={212} height={560} rx={8} fill="#f4f1e8" stroke={INK} />
      <text x={984} y={128} className="v-label" fill={INK}>
        Execution order
      </text>
      <text x={984} y={150} className="v-kicker" fill={GRAPHITE}>
        derived from edges
      </text>
      <line x1={964} y1={168} x2={1176} y2={168} stroke="rgba(23,24,21,0.15)" />
      <OrderList x={984} y={204} rowHeight={54} />
      <line x1={964} y1={530} x2={1176} y2={530} stroke="rgba(23,24,21,0.15)" />
      <Badge x={998} y={572} order={null} />
      <text x={1024} y={568} className="v-label" fill={GRAPHITE}>
        Online search
      </text>
      <text x={1024} y={590} className="v-kicker" fill={GRAPHITE}>
        joins after save
      </text>
    </>
  );
}

function Narrow() {
  const nodes: AgentNode[] = [
    { ...wideNodes[0], x: 200, y: 40 },
    { ...wideNodes[1], x: 40, y: 168 },
    { ...wideNodes[2], x: 320, y: 168 },
    { ...wideNodes[3], x: 180, y: 296 },
    { ...wideNodes[4], x: 40, y: 424 },
    { ...wideNodes[5], x: 320, y: 424 },
  ];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const width = (node: AgentNode) => (node.id === 'trigger' || node.id === 'llm' ? 200 : 240);
  return (
    <>
      <Dots width={600} height={760} color="rgba(23,24,21,0.16)" background="#e9e6dc" />
      {wideEdges.map(([from, to]) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b) return null;
        return (
          <path
            key={`${from}-${to}`}
            d={verticalPath({ x: a.x + width(a) / 2, y: a.y + 76 }, { x: b.x + width(b) / 2, y: b.y })}
            fill="none"
            stroke={INK}
            strokeWidth="1.5"
          />
        );
      })}
      {nodes.map((node) => (
        <g key={node.id}>
          <VizNode x={node.x} y={node.y} w={width(node)} h={76} kicker={node.kicker} title={node.title} />
          <Badge x={node.x + width(node) - 2} y={node.y} order={node.order} />
        </g>
      ))}
      <rect x={24} y={548} width={552} height={188} rx={8} fill="#f4f1e8" stroke={INK} />
      <text x={44} y={582} className="v-label" fill={INK}>
        Execution order
      </text>
      <text x={556} y={582} textAnchor="end" className="v-kicker" fill={GRAPHITE}>
        derived from edges
      </text>
      <OrderList x={44} y={622} rowHeight={42} columns={2} columnWidth={272} />
    </>
  );
}

export function IgotVisual() {
  return (
    <VizFrame
      label="Reconstruction of the iGOT.ai agent builder: six task nodes auto-laid-out in four dependency layers, each with an execution-order badge that matches an execution order panel derived from the edges, plus a seventh node shown optimistically while it saves."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
