'use client';

import { useEffect, useRef, useState } from 'react';

interface CopyEmailButtonProps {
  email: string;
}

const CopyState = {
  IDLE: 'idle',
  COPIED: 'copied',
  FAILED: 'failed',
} as const;
type CopyState = (typeof CopyState)[keyof typeof CopyState];

const LABEL: Record<CopyState, string> = {
  [CopyState.IDLE]: 'Copy email',
  [CopyState.COPIED]: 'Copied',
  [CopyState.FAILED]: 'Copy failed, select the address instead',
};

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [state, setState] = useState<CopyState>(CopyState.IDLE);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState(CopyState.COPIED);
    } catch {
      setState(CopyState.FAILED);
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState(CopyState.IDLE), 2400);
  };

  return (
    <button type="button" onClick={copy} className="copy-button" data-state={state}>
      <span className="copy-button-port" aria-hidden="true" />
      <span aria-live="polite">{LABEL[state]}</span>
    </button>
  );
}
