import type { Metric } from '@/content/types';

interface MetricListProps {
  metrics: Metric[];
  className?: string;
}

/** A row of labelled figures: value, label, and the context that keeps it honest. */
export function MetricList({ metrics, className }: MetricListProps) {
  return (
    <dl className={`feature-metrics ${className ?? ''}`}>
      {metrics.map((metric) => (
        <div key={metric.label} className="feature-metric">
          <dt>
            <span className="type-figure feature-metric-value">{metric.value}</span>
            <span className="feature-metric-label">{metric.label}</span>
          </dt>
          <dd className="type-small feature-metric-context">{metric.context}</dd>
        </div>
      ))}
    </dl>
  );
}
