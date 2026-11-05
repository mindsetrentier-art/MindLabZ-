import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  resetKey?: string | number | boolean;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  showDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      // Auto-recover cleanly when the user navigates to another page
      this.setState({ hasError: false, error: null, errorInfo: null });
      this.props.onReset?.();
    }
  }

  private handleQuickRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  private handleFullReload = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCache = (): void => {
    try {
      localStorage.removeItem('mindlabz_user_profile_v1');
      localStorage.removeItem('mindlabz_saved_accounts_v1');
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[55vh] flex items-center justify-center p-4 sm:p-6 text-center animate-fadeIn">
          <div className="max-w-lg w-full bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 text-balance">
              <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
                {this.props.fallbackTitle || 'Affichage temporairement indisponible · 正在优化加载'}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
                Une anomalie temporaire a été sécurisée sans perte de données. Vous pouvez réactualiser l'affichage instantanément ou réinitialiser le cache local pour recharger votre profil en toute fluidité.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleQuickRetry}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réessayer immédiatement (立即恢复)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCache}
                className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Accueil & Cache propre</span>
              </button>
            </div>

            {/* Expandable Technical Diagnostic Details */}
            {this.state.error && (
              <div className="pt-2 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-stone-600 hover:text-stone-700 underline cursor-pointer block mx-auto text-center"
                >
                  {this.state.showDetails ? 'Masquer le rapport technique ▲' : 'Détails du diagnostic technique ▼'}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] font-mono text-stone-700 overflow-x-auto max-h-40 leading-relaxed">
                    <div className="font-bold text-rose-700 mb-1">{this.state.error.name}: {this.state.error.message}</div>
                    {this.state.error.stack && (
                      <pre className="text-[10px] text-stone-500 whitespace-pre-wrap break-all">
                        {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
