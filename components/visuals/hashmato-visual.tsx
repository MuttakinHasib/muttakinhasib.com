import { useId } from 'react';
import { Port, Tag, VizFrame, VizNode, verticalPath, wirePath } from './primitives';
import { VIZ_FOG as FOG, VIZ_GRAPHITE as GRAPHITE, VIZ_INK as INK, VIZ_LEDGER as LEDGER, VIZ_PAPER as PAPER } from './palette';

interface PillProps {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  w?: number;
}

interface CylinderProps {
  x: number;
  y: number;
  label: string;
  active?: boolean;
  w?: number;
}

interface LinkProps {
  d: string;
  active?: boolean;
  dashed?: boolean;
}

interface GridProps {
  width: number;
  height: number;
}

function Grid({ width, height }: GridProps) {
  const id = useId();
  return (
    <>
      <defs>
        <pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="rgba(23,24,21,0.07)" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={PAPER} />
      <rect width={width} height={height} fill={`url(#${id})`} />
    </>
  );
}

function Link({ d, active, dashed }: LinkProps) {
  return (
    <path
      d={d}
      fill="none"
      stroke={active ? LEDGER : INK}
      strokeWidth={active ? 3 : 1.4}
      strokeDasharray={dashed ? '5 5' : undefined}
      opacity={active ? 1 : 0.55}
    />
  );
}

function Pill({ x, y, label, active, w = 180 }: PillProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={38} rx={5} fill={active ? LEDGER : '#fbfaf6'} stroke={INK} />
      <text x={x + 16} y={y + 25} className="v-label" fill={INK}>
        {label}
      </text>
      <Port x={x} y={y + 19} fill={active ? LEDGER : PAPER} stroke={INK} />
    </g>
  );
}

function Cylinder({ x, y, label, active, w = 120 }: CylinderProps) {
  const rx = w / 2;
  return (
    <g>
      <path
        d={`M${x} ${y}V${y + 44}A${rx} 10 0 0 0 ${x + w} ${y + 44}V${y}`}
        fill={active ? LEDGER : '#fbfaf6'}
        stroke={INK}
        strokeWidth="1.25"
      />
      <ellipse cx={x + rx} cy={y} rx={rx} ry={10} fill={active ? '#f0bd6e' : PAPER} stroke={INK} strokeWidth="1.25" />
      <text x={x + rx} y={y + 36} textAnchor="middle" className="v-kicker" fill={INK}>
        {label}
      </text>
    </g>
  );
}

function Receipt() {
  const zigzag = Array.from({ length: 20 }, (_, index) => {
    const step = index + 1;
    return `L${214 - step * 8} ${step % 2 === 1 ? 708 : 700}`;
  }).join('');
  return (
    <g>
      <path d={`M54 420H214V700${zigzag}Z`} fill="#fbfaf6" stroke={INK} strokeWidth="1.25" />
      <text x={70} y={450} className="v-kicker" fill={GRAPHITE}>
        order ticket
      </text>
      <text x={70} y={480} className="v-title" fill={INK}>
        A-0142
      </text>
      <line x1={70} y1={496} x2={198} y2={496} stroke={INK} strokeDasharray="2 3" />
      {[
        ['Latte ×2', '8.40'],
        ['Bagel combo', '6.90'],
        ['Refund, 1 item', '−3.20'],
      ].map(([item, amount], index) => (
        <g key={item}>
          <text x={70} y={522 + index * 24} className="v-small" fill={INK}>
            {item}
          </text>
          <text x={198} y={522 + index * 24} textAnchor="end" className="v-small" fill={INK}>
            {amount}
          </text>
        </g>
      ))}
      <line x1={70} y1={586} x2={198} y2={586} stroke={INK} strokeDasharray="2 3" />
      <text x={70} y={610} className="v-small" fill={INK}>
        Paid from wallet
      </text>
      <text x={70} y={634} className="v-small" fill={GRAPHITE}>
        Auto-recharge on
      </text>
      <text x={70} y={666} className="v-kicker" fill={GRAPHITE}>
        queue no. 17
      </text>
    </g>
  );
}

function Wide() {
  return (
    <>
      <Grid width={1200} height={760} />

      {/* Tenants */}
      <VizNode x={40} y={110} w={180} h={78} kicker="tenant A" title="Café" ports={{ out: true }} />
      <VizNode x={40} y={232} w={180} h={78} kicker="tenant B" title="Retail" state="active" accent={LEDGER} ports={{ out: true, outActive: true }} />
      <Receipt />

      {/* Services inside the cluster */}
      <rect x={284} y={84} width={300} height={472} rx={10} fill="rgba(233,230,220,0.6)" stroke={INK} strokeDasharray="6 5" />
      <text x={302} y={110} className="v-kicker" fill={GRAPHITE}>
        kubernetes, nestjs services
      </text>
      {['Payments', 'Delivery', 'Pricing', 'Ordering'].map((name, index) => (
        <VizNode key={name} x={314} y={128 + index * 104} w={240} h={76} kicker="nestjs" title={name} ports={{ in: true, out: index < 2 }} />
      ))}

      {/* Interfaces and adapters */}
      <VizNode x={652} y={134} w={200} h={64} kicker="interface" title="PaymentProvider" ports={{ in: true, out: true }} />
      <VizNode x={652} y={340} w={200} h={64} kicker="interface" title="DeliveryPartner" ports={{ in: true, out: true }} />
      {['Stripe', 'Omise', 'PayNow QR', 'In-house'].map((name, index) => (
        <Pill key={name} x={952} y={62 + index * 52} label={name} active={name === 'PayNow QR'} />
      ))}
      {['Deliveroo', 'Grab', 'Delivery Hero'].map((name, index) => (
        <Pill key={name} x={952} y={300 + index * 52} label={name} />
      ))}

      {/* Data layer */}
      <rect x={284} y={590} width={616} height={50} rx={6} fill={INK} />
      <text x={304} y={621} className="v-label" fill={PAPER}>
        Shared data-access layer
      </text>
      <text x={880} y={621} textAnchor="end" className="v-kicker" fill={FOG}>
        30+ domain modules
      </text>
      <Cylinder x={300} y={680} label="tenant_a" />
      <Cylinder x={440} y={680} label="tenant_b" active />
      <Cylinder x={580} y={680} label="tenant_n" />
      <Cylinder x={740} y={680} label="redis" w={140} />

      {/* Wiring */}
      <Link d={wirePath({ x: 220, y: 149 }, { x: 314, y: 166 })} />
      <Link d={wirePath({ x: 220, y: 271 }, { x: 314, y: 166 })} active />
      <Link d={wirePath({ x: 220, y: 271 }, { x: 314, y: 478 })} />
      <Link d={wirePath({ x: 554, y: 166 }, { x: 652, y: 166 })} active />
      <Link d={wirePath({ x: 554, y: 270 }, { x: 652, y: 372 })} />
      {[0, 1, 2, 3].map((index) => (
        <Link key={index} d={wirePath({ x: 852, y: 166 }, { x: 952, y: 81 + index * 52 })} active={index === 2} />
      ))}
      {[0, 1, 2].map((index) => (
        <Link key={index} d={wirePath({ x: 852, y: 372 }, { x: 952, y: 319 + index * 52 })} />
      ))}
      <Link d={verticalPath({ x: 434, y: 556 }, { x: 434, y: 590 })} />
      <Link d={verticalPath({ x: 500, y: 640 }, { x: 500, y: 670 })} active />
      <Link d={verticalPath({ x: 360, y: 640 }, { x: 360, y: 670 })} />
      <Link d={verticalPath({ x: 640, y: 640 }, { x: 640, y: 670 })} />
      <Link d={verticalPath({ x: 810, y: 640 }, { x: 810, y: 670 })} />

      {/* Webhooks come back verified and retried */}
      <path d="M1132 268C1170 268 1180 470 1100 500C1010 532 690 520 600 470" fill="none" stroke={INK} strokeDasharray="5 5" opacity="0.7" />
      <path d="M606 462L598 470L610 474" fill="none" stroke={INK} />
      <text x={760} y={540} className="v-kicker" fill={INK}>
        HMAC-verified webhooks, BullMQ retries
      </text>

      <Tag x={40} y={326} label="tenant B route" fill={LEDGER} color={INK} />

      {/* Drawing title block */}
      <rect x={940} y={590} width={226} height={130} fill="#fbfaf6" stroke={INK} />
      <line x1={940} y1={622} x2={1166} y2={622} stroke={INK} />
      <text x={954} y={612} className="v-kicker" fill={GRAPHITE}>
        system sketch
      </text>
      <text x={954} y={650} className="v-label" fill={INK}>
        Hashmato cloud POS
      </text>
      <text x={954} y={674} className="v-small" fill={GRAPHITE}>
        One tenant’s path shown.
      </text>
      <text x={954} y={698} className="v-small" fill={GRAPHITE}>
        Simplified, not exhaustive.
      </text>
    </>
  );
}

function Narrow() {
  return (
    <>
      <Grid width={600} height={760} />
      <VizNode x={40} y={40} w={240} h={70} kicker="tenant A" title="Café" />
      <VizNode x={320} y={40} w={240} h={70} kicker="tenant B" title="Retail" state="active" accent={LEDGER} />
      <rect x={24} y={150} width={552} height={220} rx={10} fill="rgba(233,230,220,0.6)" stroke={INK} strokeDasharray="6 5" />
      <text x={40} y={174} className="v-kicker" fill={GRAPHITE}>
        kubernetes, nestjs services
      </text>
      <VizNode x={48} y={190} w={240} h={70} kicker="nestjs" title="Payments" state="active" accent={LEDGER} />
      <VizNode x={312} y={190} w={240} h={70} kicker="nestjs" title="Delivery" />
      <VizNode x={48} y={280} w={240} h={70} kicker="nestjs" title="Pricing" />
      <VizNode x={312} y={280} w={240} h={70} kicker="nestjs" title="Ordering" />
      <Link d={verticalPath({ x: 440, y: 110 }, { x: 168, y: 190 })} active />
      <Link d={verticalPath({ x: 160, y: 110 }, { x: 168, y: 190 })} />

      <text x={40} y={410} className="v-kicker" fill={GRAPHITE}>
        payment providers, one adapter
      </text>
      {['Stripe', 'Omise', 'PayNow QR', 'In-house'].map((name, index) => (
        <Pill key={name} x={40 + (index % 2) * 270} y={424 + Math.floor(index / 2) * 48} label={name} w={250} active={name === 'PayNow QR'} />
      ))}
      <rect x={24} y={540} width={552} height={48} rx={6} fill={INK} />
      <text x={44} y={570} className="v-label" fill={PAPER}>
        Shared data-access layer
      </text>
      <text x={556} y={570} textAnchor="end" className="v-kicker" fill={FOG}>
        30+ modules
      </text>
      <Cylinder x={40} y={636} label="tenant_a" />
      <Cylinder x={176} y={636} label="tenant_b" active />
      <Cylinder x={312} y={636} label="tenant_n" />
      <Cylinder x={448} y={636} label="redis" />
      <Link d={verticalPath({ x: 236, y: 588 }, { x: 236, y: 626 })} active />
    </>
  );
}

export function HashmatoVisual() {
  return (
    <VizFrame
      label="System sketch of the Hashmato POS backend: tenants call NestJS payment, delivery, pricing, and ordering services in Kubernetes; payments go through one PaymentProvider interface to Stripe, Omise, PayNow QR, or an in-house gateway; delivery goes through one partner interface to Deliveroo, Grab, and Delivery Hero; a shared data-access layer sits over one PostgreSQL database per tenant plus Redis. Tenant B’s route to PayNow QR and its own database is highlighted."
      wide={<Wide />}
      narrow={<Narrow />}
    />
  );
}
