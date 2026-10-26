import { Component, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type BoundaryProps = { children: ReactNode; resetKey: string };
type BoundaryState = { failed: boolean; resetKey: string };

class ScreenBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState) {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }

  render() {
    if (this.state.failed) return <section className="surface-card p-6" aria-label="画面の読み込みエラー">
      <h2>画面を読み込めませんでした</h2>
      <p role="alert">通信状態を確認して、画面を再読み込みしてください。更新された画面を取得し直します。</p>
      <button type="button" className="primary-button" onClick={() => window.location.reload()}>画面を再読み込み</button>
    </section>;
    return this.props.children;
  }
}

/** Keep loading and recovery local to the requested page or chart. */
export function AsyncScreen({ children, label = '画面を読み込んでいます…', page = false }: { children: ReactNode; label?: string; page?: boolean }) {
  const { pathname } = useLocation();
  return <ScreenBoundary resetKey={pathname}>
    <Suspense key={page ? pathname : undefined} fallback={<div role="status" className="p-6" aria-live="polite">{label}</div>}>
      {children}
    </Suspense>
  </ScreenBoundary>;
}
