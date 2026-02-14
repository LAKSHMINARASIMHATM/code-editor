import React, { useState } from 'react';
import { Key, Shield, User, Save, Trash2, Github, AlertCircle } from 'lucide-react';
import './GitAuth.css';

export const GitAuth = ({ socket, onAuthUpdate }) => {
    const [platform, setPlatform] = useState('github.com');
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');
    const [status, setStatus] = useState(null);

    const handleStoreToken = () => {
        if (!token || !username) {
            setStatus({ type: 'error', message: 'Username and Token are required' });
            return;
        }

        socket.emit('git_auth_store', {
            platform,
            username,
            token
        });

        setStatus({ type: 'info', message: 'Storing token...' });

        // Listen for specific response
        const handleResponse = (data) => {
            if (data.platform === platform) {
                setStatus({
                    type: data.success ? 'success' : 'error',
                    message: data.success ? 'Token stored securely!' : 'Failed to store token'
                });
                if (data.success) {
                    setToken('');
                    onAuthUpdate?.();
                }
                socket.off('git_auth_response', handleResponse);
            }
        };
        socket.on('git_auth_response', handleResponse);
    };

    return (
        <div className="git-auth-panel">
            <div className="auth-header">
                <Shield size={18} className="text-orange-500" />
                <h3>Git Authentication</h3>
            </div>

            <p className="auth-descr">
                Store your Personal Access Tokens securely using industry-standard encryption.
            </p>

            <div className="auth-form">
                <div className="form-group">
                    <label><Github size={14} /> Platform</label>
                    <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                        <option value="github.com">GitHub</option>
                        <option value="gitlab.com">GitLab</option>
                        <option value="bitbucket.org">Bitbucket</option>
                    </select>
                </div>

                <div className="form-group">
                    <label><User size={14} /> Username</label>
                    <input
                        type="text"
                        placeholder="e.g. flux-user"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label><Key size={14} /> Access Token</label>
                    <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </div>

                {status && (
                    <div className={`auth-status ${status.type}`}>
                        <AlertCircle size={14} />
                        <span>{status.message}</span>
                    </div>
                )}

                <button className="auth-save-btn" onClick={handleStoreToken}>
                    <Save size={16} />
                    <span>Save Token</span>
                </button>
            </div>

            <div className="auth-tips">
                <h4>Security Tip</h4>
                <p>Use a Token with minimum scopes (repo access only) for maximum security.</p>
            </div>
        </div>
    );
};
