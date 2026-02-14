import React, { useEffect, useRef } from 'react';
import { History, Clock, User, FileText, GitCommit, Shield, Package } from 'lucide-react';
import './ActivityPanel.css';

const ActivityPanel = ({ logs }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0; // Show latest at top
        }
    }, [logs]);

    const getIcon = (action) => {
        if (action.includes('joined')) return <User size={12} className="text-emerald-500" />;
        if (action.includes('left')) return <User size={12} className="text-red-500" />;
        if (action.includes('file')) return <FileText size={12} className="text-blue-500" />;
        if (action.includes('committed') || action.includes('pushed')) return <GitCommit size={12} className="text-orange-500" />;
        if (action.includes('host')) return <Shield size={12} className="text-orange-500" />;
        if (action.includes('extension')) return <Package size={12} className="text-purple-500" />;
        return <Clock size={12} className="text-neutral-500" />;
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="activity-panel">
            <div className="activity-header">
                <History size={14} />
                <span>PROJECT TIMELINE</span>
            </div>
            <div className="activity-list" ref={scrollRef}>
                {logs.length === 0 ? (
                    <div className="empty-activity">
                        <Clock size={32} />
                        <p>No activity recorded yet</p>
                    </div>
                ) : (
                    [...logs].reverse().map((log) => (
                        <div key={log.id} className="activity-item">
                            <div className="activity-marker">
                                <div className="marker-line"></div>
                                <div className="marker-dot">
                                    {getIcon(log.action)}
                                </div>
                            </div>
                            <div className="activity-content">
                                <div className="activity-user-row">
                                    <span className="activity-user">{log.userName}</span>
                                    <span className="activity-time">{formatTime(log.timestamp)}</span>
                                </div>
                                <div className="activity-action">{log.action}</div>
                                {log.details && <div className="activity-details">{log.details}</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityPanel;
