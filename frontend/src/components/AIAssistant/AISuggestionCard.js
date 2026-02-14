import React from 'react';
import { ThumbsUp, ThumbsDown, X, Sparkles, User } from 'lucide-react';
import './AISuggestionCard.css';

const AISuggestionCard = ({ suggestion, onVote, onDismiss }) => {
    const approvals = Object.values(suggestion.votes).filter(v => v === 'approve').length;
    const totalVotes = Object.keys(suggestion.votes).length;

    return (
        <div className="ai-suggestion-card">
            <div className="ai-suggestion-badge">
                <Sparkles size={12} />
                <span>AI SUGGESTION</span>
            </div>

            <div className="ai-suggestion-header">
                <div className="user-info">
                    <User size={14} className="text-orange-500" />
                    <span>{suggestion.userName} shared a code snippet</span>
                </div>
                <button className="dismiss-btn" onClick={() => onDismiss(suggestion.id)}>
                    <X size={14} />
                </button>
            </div>

            <div className="suggestion-code-preview">
                <pre><code>{suggestion.code.substring(0, 150)}{suggestion.code.length > 150 ? '...' : ''}</code></pre>
            </div>

            <div className="suggestion-footer">
                <div className="approval-status">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(approvals / 2) * 100}%` }} // Simplified visual
                        ></div>
                    </div>
                    <span>{approvals} approvals</span>
                </div>

                <div className="vote-actions">
                    <button
                        className="vote-btn reject"
                        onClick={() => onVote(suggestion.id, 'reject')}
                        title="Reject"
                    >
                        <ThumbsDown size={14} />
                    </button>
                    <button
                        className="vote-btn approve"
                        onClick={() => onVote(suggestion.id, 'approve')}
                        title="Approve"
                    >
                        <ThumbsUp size={14} />
                        <span>APPROVE</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AISuggestionCard;
