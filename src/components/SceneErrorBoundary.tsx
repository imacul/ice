import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode; onError?: (error: Error, info: ErrorInfo) => void };
type State = { failed: boolean };

export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { this.props.onError?.(error, info); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
