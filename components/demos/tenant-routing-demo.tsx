'use client';

import { useId, useState } from 'react';
import { wirePath } from '../visuals/primitives';
import { DemoFrame } from './demo-frame';

const Tenant = { A: 'a', B: 'b', C: 'c' } as const;
type Tenant = (typeof Tenant)[keyof typeof Tenant];

const Request = {
  PAYMENT: 'payment',
  DELIVERY: 'delivery',
  PRICE: 'price',
  WALLET: 'wallet',
} as const;
type Request = (typeof Request)[keyof typeof Request];

interface TenantConfig {
  name: string;
  business: string;
  provider: string;
  partner: string;
}

interface DiagramNode {
  id: string;
  column: number;
  row: number;
  label: string;
  kicker: string;
}

interface Route {
  nodes: string[];
  steps: string[];
}

interface Layout {
  width: number;
  height: number;
}

interface DiagramProps {
  layout: Layout;
  nodes: DiagramNode[];
  active: Set<string>;
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
}

interface PathChipsProps {
  nodes: DiagramNode[];
  route: Route;
}

const tenants: Record<Tenant, TenantConfig> = {
  [Tenant.A]: { name: 'Tenant A', business: 'Café', provider: 'Stripe', partner: 'Grab' },
  [Tenant.B]: { name: 'Tenant B', business: 'Retail', provider: 'PayNow QR', partner: 'Deliveroo' },
  [Tenant.C]: { name: 'Tenant C', business: 'Bakery', provider: 'Omise', partner: 'Delivery Hero' },
};

const requestLabels: Record<Request, string> = {
  [Request.PAYMENT]: 'Card payment',
  [Request.DELIVERY]: 'Delivery order',
  [Request.PRICE]: 'Price lookup',
  [Request.WALLET]: 'Wallet top-up',
};

const EDGES: [string, string][] = [
  ['tenant', 'payments'],
  ['tenant', 'delivery'],
  ['tenant', 'pricing'],
  ['tenant', 'ordering'],
  ['payments', 'provider-interface'],
  ['delivery', 'partner-interface'],
  ['pricing', 'rules'],
  ['ordering', 'ledger'],
  ['delivery', 'ordering'],
  ['provider-interface', 'provider'],
  ['partner-interface', 'partner'],
  ['rules', 'schedules'],
  ['ledger', 'wallet'],
  ['provider', 'queue'],
  ['partner', 'queue'],
  ['schedules', 'db'],
  ['wallet', 'db'],
  ['ledger', 'redis'],
  ['queue', 'db'],
];

function buildNodes(tenant: TenantConfig): DiagramNode[] {
  return [
    { id: 'tenant', column: 0, row: 1.5, label: tenant.name, kicker: tenant.business.toLowerCase() },
    { id: 'payments', column: 1, row: 0, label: 'Payments', kicker: 'nestjs' },
    { id: 'delivery', column: 1, row: 1, label: 'Delivery', kicker: 'nestjs' },
    { id: 'ordering', column: 1, row: 2, label: 'Ordering', kicker: 'nestjs' },
    { id: 'pricing', column: 1, row: 3, label: 'Pricing', kicker: 'nestjs' },
    { id: 'provider-interface', column: 2, row: 0, label: 'PaymentProvider', kicker: 'interface' },
    { id: 'partner-interface', column: 2, row: 1, label: 'DeliveryPartner', kicker: 'interface' },
    { id: 'ledger', column: 2, row: 2, label: 'Wallet ledger', kicker: 'transaction' },
    { id: 'rules', column: 2, row: 3, label: 'Price rules', kicker: 'engine' },
    { id: 'provider', column: 3, row: 0, label: tenant.provider, kicker: 'provider' },
    { id: 'partner', column: 3, row: 1, label: tenant.partner, kicker: 'partner' },
    { id: 'wallet', column: 3, row: 2, label: 'Balance', kicker: 'stored value' },
    { id: 'schedules', column: 3, row: 3, label: 'Schedules', kicker: 'brand, channel, time' },
    { id: 'queue', column: 4, row: 0.5, label: 'BullMQ', kicker: 'retries' },
    { id: 'db', column: 4, row: 2, label: `tenant_${tenant.name.slice(-1).toLowerCase()}`, kicker: 'postgresql' },
    { id: 'redis', column: 4, row: 3.2, label: 'Redis', kicker: 'lua counter' },
  ];
}

function buildRoute(request: Request, tenant: TenantConfig): Route {
  const db = `tenant_${tenant.name.slice(-1).toLowerCase()}`;
  switch (request) {
    case Request.PAYMENT:
      return {
        nodes: ['tenant', 'payments', 'provider-interface', 'provider', 'queue', 'db'],
        steps: [
          `${tenant.name}’s POS calls the Payments service.`,
          `Payments resolves this tenant’s provider through the PaymentProvider interface: ${tenant.provider}.`,
          `${tenant.provider} confirms by webhook, and its HMAC signature is verified.`,
          'If processing fails, BullMQ retries the job.',
          `The result is written to ${db}, this tenant’s own database.`,
        ],
      };
    case Request.DELIVERY:
      return {
        nodes: ['partner', 'partner-interface', 'delivery', 'ordering', 'ledger', 'redis', 'queue', 'db'],
        steps: [
          `${tenant.partner} sends an order webhook, verified with OAuth2/HMAC.`,
          'The Delivery service maps it through the DeliveryPartner interface.',
          'Ordering creates the order inside a PostgreSQL transaction.',
          'A Redis Lua script assigns the next queue number atomically.',
          `The order lands in ${db}.`,
        ],
      };
    case Request.PRICE:
      return {
        nodes: ['tenant', 'pricing', 'rules', 'schedules', 'db'],
        steps: [
          'The POS asks Pricing for a page of menu items.',
          'Pricing applies brand, location, channel, and timezone schedules.',
          'Overrides for the whole page load in one batched query, not one per item.',
          `Reads come only from ${db}.`,
        ],
      };
    case Request.WALLET:
      return {
        nodes: ['tenant', 'ordering', 'ledger', 'wallet', 'db'],
        steps: [
          'The POS sends a wallet top-up to Ordering.',
          'The wallet ledger records it inside a PostgreSQL transaction.',
          'Auto-recharge rules are checked against the new balance.',
          `Balance and ledger entry are stored in ${db}.`,
        ],
      };
    default: {
      const exhaustive: never = request;
      throw new Error(`Unknown request: ${exhaustive}`);
    }
  }
}

const wide: Layout = { width: 1000, height: 420 };
const NODE_W = 170;
const NODE_H = 60;

function position(node: DiagramNode): { x: number; y: number } {
  return { x: 10 + node.column * 200, y: 20 + node.row * 100 };
}

function Diagram({ layout, nodes, active }: DiagramProps) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (
    <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="tr-wide" aria-hidden="true" focusable="false">
      {EDGES.map(([from, to]) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b) return null;
        const pa = position(a);
        const pb = position(b);
        const on = active.has(from) && active.has(to);
        let d: string;
        if (a.column === b.column) {
          d = `M${pa.x + NODE_W / 2} ${pa.y + NODE_H}L${pb.x + NODE_W / 2} ${pb.y}`;
        } else {
          d = wirePath({ x: pa.x + NODE_W, y: pa.y + NODE_H / 2 }, { x: pb.x, y: pb.y + NODE_H / 2 });
        }
        return <path key={`${from}-${to}`} d={d} className="tr-edge" data-active={on || undefined} />;
      })}
      {nodes.map((node) => {
        const p = position(node);
        return (
          <g key={node.id} className="tr-node" data-active={active.has(node.id) || undefined}>
            <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={6} />
            <text x={p.x + 12} y={p.y + 22} className="tr-kicker">
              {node.kicker}
            </text>
            <text x={p.x + 12} y={p.y + 44} className="tr-label">
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Small screens get the same route as a readable chain instead of a scaled-down diagram. */
function PathChips({ nodes, route }: PathChipsProps) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return (
    <ol className="tr-chips" aria-label="Route">
      {route.nodes.map((id) => {
        const node = byId.get(id);
        if (!node) return null;
        return (
          <li key={id}>
            <span className="type-mono text-graphite">{node.kicker}</span>
            <span className="font-[600]">{node.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Segmented<T extends string>({ legend, name, value, options, onChange }: SegmentedProps<T>) {
  return (
    <fieldset className="segmented">
      <legend className="type-small font-[600]">{legend}</legend>
      <div className="segmented-options">
        {options.map((option) => (
          <label key={option.value} className="segmented-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function TenantRoutingDemo() {
  const [tenant, setTenant] = useState<Tenant>(Tenant.B);
  const [request, setRequest] = useState<Request>(Request.PAYMENT);
  const name = useId();
  const config = tenants[tenant];
  const nodes = buildNodes(config);
  const route = buildRoute(request, config);
  const active = new Set(route.nodes);

  return (
    <DemoFrame
      title="Follow a request"
      instructions="Pick an example tenant and a request type. The highlighted path shows which interface, provider, and database that tenant’s request uses."
      note="Example tenants and a simplified map of the services described in this case study."
    >
      <div className="tr-layout">
        <div className="tr-controls">
          <Segmented
            legend="Tenant"
            name={`${name}-tenant`}
            value={tenant}
            options={Object.entries(tenants).map(([value, item]) => ({
              value: value as Tenant,
              label: `${item.name}, ${item.business.toLowerCase()}`,
            }))}
            onChange={setTenant}
          />
          <Segmented
            legend="Request"
            name={`${name}-request`}
            value={request}
            options={Object.entries(requestLabels).map(([value, label]) => ({ value: value as Request, label }))}
            onChange={setRequest}
          />
        </div>
        <div className="tr-diagram">
          <Diagram layout={wide} nodes={nodes} active={active} />
          <PathChips nodes={nodes} route={route} />
        </div>
        <ol className="tr-steps" aria-live="polite">
          {route.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </DemoFrame>
  );
}
