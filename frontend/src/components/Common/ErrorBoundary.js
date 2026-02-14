import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRestart = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="error-boundary-container">
                    <div className="error-card">
                        <div className="error-icon">
                            <AlertTriangle size={48} className="text-orange-500" />
                        </div>
                        <h1 className="error-title">Flux IDE encountered a critical error</h1>
                        <p className="error-message">
                            The application crashed due to an unexpected problem. We've logged the details and are working to fix it.
                        </p>

                        <div className="error-details">
                            <div className="error-stack">
                                <code>{this.state.error && this.state.error.toString()}</code>
                            </div>
                        </div>

                        <div className="error-actions">
                            <button onClick={this.handleRestart} className="btn-primary">
                                <RefreshCw size={16} />
                                <span>Reload IDE</span>
                            </button>
                            <button onClick={() => window.location.href = '/'} className="btn-secondary">
                                <Home size={16} />
                                <span>Go to Home</span>
                            </button>
                        </div>

                        <div className="error-footer">
                            If this persists, please contact support or check your connection.
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
