import React, { useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, X, Filter, Search } from 'lucide-react';
import './ProblemsPanel.css';

/**
 * Problems Panel Component
 * Displays errors, warnings, and info messages from language servers and build tools
 */
export const ProblemsPanel = ({ problems = [], onNavigate, onClear }) => {
    const [filter, setFilter] = useState('all'); // all, errors, warnings, info
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const filteredProblems = useMemo(() => {
        let filtered = problems;

        // Filter by severity
        if (filter === 'errors') {
            filtered = filtered.filter(p => p.severity === 'error');
        } else if (filter === 'warnings') {
            filtered = filtered.filter(p => p.severity === 'warning');
        } else if (filter === 'info') {
            filtered = filtered.filter(p => p.severity === 'info');
        }

        // Filter by file
        if (selectedFile) {
            filtered = filtered.filter(p => p.file === selectedFile);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.message.toLowerCase().includes(term) ||
                p.file.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [problems, filter, selectedFile, searchTerm]);

    const problemCounts = useMemo(() => {
        const counts = { errors: 0, warnings: 0, info: 0 };
        problems.forEach(p => {
            if (p.severity === 'error') counts.errors++;
            else if (p.severity === 'warning') counts.warnings++;
            else if (p.severity === 'info') counts.info++;
        });
        return counts;
    }, [problems]);

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'error':
                return <AlertCircle size={16} className="problem-icon error" />;
            case 'warning':
                return <AlertTriangle size={16} className="problem-icon warning" />;
            case 'info':
                return <Info size={16} className="problem-icon info" />;
            default:
                return null;
        }
    };

    const handleProblemClick = (problem) => {
        if (onNavigate) {
            onNavigate(problem);
        }
    };

    return (
        <div className="problems-panel">
            <div className="problems-header">
                <div className="problems-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({problems.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'errors' ? 'active' : ''}`}
                        onClick={() => setFilter('errors')}
                    >
                        <AlertCircle size={14} />
                        Errors ({problemCounts.errors})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'warnings' ? 'active' : ''}`}
                        onClick={() => setFilter('warnings')}
                    >
                        <AlertTriangle size={14} />
                        Warnings ({problemCounts.warnings})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'info' ? 'active' : ''}`}
                        onClick={() => setFilter('info')}
                    >
                        <Info size={14} />
                        Info ({problemCounts.info})
                    </button>
                </div>

                <div className="problems-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Filter problems..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {onClear && problems.length > 0 && (
                    <button className="clear-all-btn" onClick={onClear} title="Clear all problems">
                        <X size={16} />
                        Clear All
                    </button>
                )}
            </div>

            <div className="problems-list">
                {filteredProblems.length === 0 ? (
                    <div className="problems-empty">
                        <Info size={32} />
                        <p>No problems to display</p>
                    </div>
                ) : (
                    filteredProblems.map((problem, idx) => (
                        <div
                            key={idx}
                            className={`problem-item ${problem.severity}`}
                            onClick={() => handleProblemClick(problem)}
                        >
                            <div className="problem-severity">
                                {getSeverityIcon(problem.severity)}
                            </div>
                            <div className="problem-content">
                                <div className="problem-message">{problem.message}</div>
                                <div className="problem-source">
                                    {problem.file}
                                    {problem.line && ` [${problem.line}:${problem.column || 0}]`}
                                    {problem.source && ` - ${problem.source}`}
                                </div>
                            </div>
                            {problem.quickFix && (
                                <button className="quick-fix-btn" title="Quick fix available">
                                    💡
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProblemsPanel;
