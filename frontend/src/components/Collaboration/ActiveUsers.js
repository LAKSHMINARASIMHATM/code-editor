import { Users, Zap, Shield, User } from 'lucide-react';
import './ActiveUsers.css';

const ActiveUsers = ({ users }) => {
    return (
        <div className="active-users-container">
            <div className="active-users-header">
                <Users size={14} />
                <span>Collaborators ({users.length})</span>
            </div>
            <div className="active-users-list">
                {users.map((user) => (
                    <div key={user.id} className={`user-card ${user.role}`}>
                        <div className="user-avatar-wrapper">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="user-avatar"
                                style={{ borderColor: user.color?.color || user.color }}
                            />
                            {user.role === 'host' && <div className="host-badge-icon"><Shield size={10} /></div>}
                        </div>
                        <div className="user-info">
                            <div className="user-name-row">
                                <div className="flex items-center gap-2">
                                    <span className="user-name">{user.name}</span>
                                    <span className={`role-tag ${user.role}`}>
                                        {user.role === 'host' ? 'Host' : 'Member'}
                                    </span>
                                </div>
                                {user.isTyping && <Zap size={12} className="typing-indicator" />}
                            </div>
                            <div className="user-status">
                                {user.cursor ? (
                                    <span>Line {user.cursor.lineNumber}, Col {user.cursor.column}</span>
                                ) : (
                                    <span>Idle</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveUsers;
