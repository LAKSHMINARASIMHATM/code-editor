import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { X, Check, ArrowLeft, ArrowRight, Shield, Save } from 'lucide-react';
import './ConflictModal.css';

const ConflictModal = ({ file, ours, theirs, onResolve, onClose }) => {
    const [resolveMode, setResolveMode] = useState('diff'); // diff, manual
    const [mergedContent, setMergedContent] = useState('');

    const handleAcceptOurs = () => {
        onResolve(ours);
    };

    const handleAcceptTheirs = () => {
        onResolve(theirs);
    };

    const handleSaveManual = () => {
        if (mergedContent) {
            onResolve(mergedContent);
        }
    };

    return (
        <div className="conflict-modal-overlay">
            <div className="conflict-modal">
                <div className="conflict-modal-header">
                    <div className="flex items-center gap-3">
                        <Shield size={20} className="text-orange-500" />
                        <div>
                            <h2>Resolve Conflict</h2>
                            <p className="text-xs text-neutral-500">{file}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="conflict-modal-toolbar">
                    <div className="flex gap-2">
                        <button
                            className="toolbar-btn ours"
                            onClick={handleAcceptOurs}
                            title="Accept current changes from this branch"
                        >
                            <ArrowLeft size={14} />
                            <span>Accept Ours</span>
                        </button>
                        <button
                            className="toolbar-btn theirs"
                            onClick={handleAcceptTheirs}
                            title="Accept incoming changes from merging branch"
                        >
                            <span>Accept Theirs</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className={`toolbar-btn ${resolveMode === 'diff' ? 'active' : ''}`}
                            onClick={() => setResolveMode('diff')}
                        >
                            Visual Diff
                        </button>
                    </div>
                </div>

                <div className="conflict-modal-content">
                    {resolveMode === 'diff' ? (
                        <div className="diff-container">
                            <div className="diff-labels">
                                <div className="diff-label ours">OUR CHANGES (Current)</div>
                                <div className="diff-label theirs">THEIR CHANGES (Incoming)</div>
                            </div>
                            <DiffEditor
                                height="100%"
                                original={ours}
                                modified={theirs}
                                language="javascript" // Should dynamically detect
                                theme="vs-dark"
                                options={{
                                    renderSideBySide: true,
                                    readOnly: true,
                                    fontSize: 13,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                    ) : (
                        <textarea
                            className="manual-resolve-editor"
                            value={mergedContent}
                            onChange={(e) => setMergedContent(e.target.value)}
                            placeholder="Paste or type resolved content here..."
                        />
                    )}
                </div>

                <div className="conflict-modal-footer">
                    <p className="text-xs text-neutral-500 italic">
                        Conflict resolution will stage the file for commit.
                    </p>
                    <div className="flex gap-3">
                        <button className="cancel-btn" onClick={onClose}>Cancel</button>
                        {resolveMode === 'manual' && (
                            <button className="resolve-btn" onClick={handleSaveManual}>
                                <Save size={16} />
                                <span>Save & Resolve</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConflictModal;
