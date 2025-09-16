import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl p-6">
          <h2 className="text-xl font-semibold">Something went wrong.</h2>
          <p className="text-sm text-neutral-400">Please reload the page.</p>
        </div>
      )
    }
    return this.props.children
  }
}


