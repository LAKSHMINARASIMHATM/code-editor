import React, { useState } from 'react';
import {
    GitBranch, GitCommit, GitMerge, GitPullRequest,
    Plus, Trash2, Check, RefreshCw, Upload, Download,
    Shield, Settings, FolderOpen, AlertCircle
} from 'lucide-react';
import { GitAuth } from './GitAuth';
import './GitPanel.css';

/**
 * Git Panel Component
 * Source control interface for Git operations
 */
export const GitPanel = ({ repository, onGitAction, socket, users }) => {
    const currentUser = users?.find(u => u.isLocal);
    const isHost = currentUser?.role === 'host';
    const [commitMessage, setCommitMessage] = useState('');
    const [activeTab, setActiveTab] = useState('changes'); // changes, auth, repos
    const [newRepoName, setNewRepoName] = useState('');

    const handleCommit = () => {
        if (commitMessage.trim() && repository?.stagedChanges?.length > 0) {
            onGitAction?.('commit', { message: commitMessage });
            setCommitMessage('');
        }
    };

    const handleMerge = () => {
        const source = prompt('Enter source branch to merge into ' + (repository?.currentBranch || 'main') + ':');
        if (source) {
            onGitAction?.('merge', { source });
        }
    };

    const handleDeleteBranch = (name) => {
        if (window.confirm(`Are you sure you want to delete branch "${name}"?`)) {
            onGitAction?.('branchDelete', { name });
        }
    };

    const handleCreateRepo = () => {
        if (newRepoName.trim()) {
            onGitAction?.('repoCreate', { name: newRepoName });
            setNewRepoName('');
        }
    };

    return (
        <div className="git-panel">
            <div className="git-tabs">
                <button
                    className={`tab-btn ${activeTab === 'changes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('changes')}
                >
                    <GitPullRequest size={14} />
                    <span>Changes</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'repos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('repos')}
                >
                    <FolderOpen size={14} />
                    <span>Repos</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
                    onClick={() => setActiveTab('auth')}
                >
                    <Shield size={14} />
                    <span>Auth</span>
                </button>
            </div>

            {activeTab === 'changes' && (
                <>
                    <div className="git-header">
                        <div className="git-branch-selector">
                            <GitBranch size={16} />
                            <select
                                value={repository?.currentBranch || 'main'}
                                onChange={(e) => onGitAction?.('checkout', { branch: e.target.value })}
                            >
                                {repository?.branches?.map(branch => (
                                    <option key={branch} value={branch}>
                                        {branch}
                                    </option>
                                ))}
                            </select>
                            <button className="icon-btn" onClick={() => {
                                const name = prompt('New branch name:');
                                if (name) onGitAction?.('createBranch', { name });
                            }} title={isHost ? "New branch" : "Restricted to Host"} disabled={!isHost}>
                                <Plus size={14} />
                            </button>
                            <button className="icon-btn" onClick={handleMerge} title={isHost ? "Merge branch" : "Restricted to Host"} disabled={!isHost}>
                                <GitMerge size={14} />
                            </button>
                        </div>

                        <div className="git-actions">
                            <button className="git-btn" onClick={() => onGitAction?.('pull', {})} title={isHost ? "Pull" : "Restricted to Host"} disabled={!isHost}>
                                <Download size={14} />
                                Pull
                            </button>
                            <button className="git-btn" onClick={() => onGitAction?.('push', {})} title={isHost ? "Push" : "Restricted to Host"} disabled={!isHost}>
                                <Upload size={14} />
                                Push
                            </button>
                            <button className="icon-btn" onClick={() => onGitAction?.('refresh', {})} title="Refresh">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="git-changes">
                        {repository?.conflicted?.length > 0 && (
                            <div className="changes-section conflicts">
                                <div className="section-header danger">
                                    <AlertCircle size={14} />
                                    <span>CONFLICTS ({repository.conflicted.length})</span>
                                </div>
                                <div className="changes-list">
                                    {repository.conflicted.map((file, idx) => (
                                        <div key={idx} className="change-item conflict">
                                            <span className="change-file text-red-500">{file}</span>
                                            <button
                                                className="change-action resolve text-orange-500 hover:bg-orange-500/10 p-1 rounded"
                                                onClick={() => onGitAction?.('conflictDetails', { file })}
                                                title="Resolve Conflict"
                                            >
                                                <GitMerge size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {repository?.stagedChanges?.length > 0 && (
                            <div className="changes-section">
                                <div className="section-header">
                                    <span>Staged Changes ({repository.stagedChanges.length})</span>
                                </div>
                                <div className="changes-list">
                                    {repository.stagedChanges.map((file, idx) => (
                                        <div key={idx} className="change-item staged">
                                            <Check size={14} className="change-status" />
                                            <span className="change-file">{file.path}</span>
                                            <button className="change-action" onClick={() => onGitAction?.('unstage', { file })}>−</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {repository?.unstagedChanges?.length > 0 && (
                            <div className="changes-section">
                                <div className="section-header">
                                    <span>Changes ({repository.unstagedChanges.length})</span>
                                </div>
                                <div className="changes-list">
                                    {repository.unstagedChanges.map((file, idx) => (
                                        <div key={idx} className={`change-item ${file.status}`}>
                                            <span className="change-status">{file.status[0].toUpperCase()}</span>
                                            <span className="change-file">{file.path}</span>
                                            <button className="change-action" onClick={() => onGitAction?.('stage', { file })}>+</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!repository?.stagedChanges?.length && !repository?.unstagedChanges?.length && !repository?.conflicted?.length && (
                            <div className="no-changes">
                                <GitCommit size={48} />
                                <p>No changes detected</p>
                            </div>
                        )}
                    </div>

                    {repository?.stagedChanges?.length > 0 && (
                        <div className="git-commit-section">
                            <textarea
                                className="commit-message"
                                placeholder="Commit message..."
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                rows={3}
                            />
                            <button
                                className="commit-btn"
                                onClick={handleCommit}
                                disabled={!commitMessage.trim() || !isHost}
                                title={isHost ? "Commit changes" : "Restricted to Host"}
                            >
                                <GitCommit size={16} />
                                Commit
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'repos' && (
                <div className="git-repos-view">
                    <div className="repo-create-form p-4 border-b border-white/5">
                        <label className="text-[10px] text-neutral-500 uppercase block mb-2">Create New Local Repository</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Repo name..."
                                value={newRepoName}
                                onChange={e => setNewRepoName(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-orange-500"
                                disabled={!isHost}
                            />
                            <button className="bg-orange-500 text-white px-3 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleCreateRepo} disabled={!isHost}>
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="repos-list p-2">
                        {repository?.localRepos?.map((repo, idx) => (
                            <div key={idx} className="repo-item flex items-center justify-between p-2 hover:bg-white/5 rounded group">
                                <div className="flex items-center gap-3">
                                    <FolderOpen size={14} className="text-orange-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{repo.name}</span>
                                        <span className="text-[10px] text-neutral-500">{repo.branch}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-1 hover:text-red-500 disabled:opacity-50"
                                        onClick={() => onGitAction?.('repoDelete', { name: repo.name })}
                                        title={isHost ? "Delete Repository" : "Restricted to Host"}
                                        disabled={!isHost}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'auth' && (
                <GitAuth socket={socket} />
            )}
        </div>
    );
};

export default GitPanel;
