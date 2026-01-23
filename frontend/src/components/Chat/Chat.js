import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import './Chat.css';

const Chat = ({ socket, currentUser, users }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const isMinimizedRef = useRef(isMinimized);

    useEffect(() => {
        isMinimizedRef.current = isMinimized;
    }, [isMinimized]);

    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (data) => {
            console.log('Received chat message:', data);
            const newMessage = {
                id: `${data.userId}-${data.timestamp}-${Math.random()}`,
                userId: data.userId,
                userName: data.userName,
                userColor: data.userColor,
                userAvatar: data.userAvatar,
                message: data.message,
                timestamp: data.timestamp || Date.now(),
            };

            setMessages(prev => {
                const updated = [...prev, newMessage];
                console.log('Messages state updated:', updated);
                return updated;
            });

            // Increment unread count if minimized
            if (isMinimizedRef.current) {
                setUnreadCount(prev => prev + 1);
            }
        };

        socket.on('chat_message', handleChatMessage);

        return () => {
            socket.off('chat_message', handleChatMessage);
        };
    }, [socket]);

    const sendMessage = (e) => {
        e?.preventDefault();

        if (!inputMessage.trim() || !socket || !currentUser) {
            console.log('Cannot send message:', {
                hasMessage: !!inputMessage.trim(),
                hasSocket: !!socket,
                socketConnected: socket?.connected,
                hasCurrentUser: !!currentUser
            });
            return;
        }

        const messageData = {
            userId: currentUser.id,
            userName: currentUser.name,
            userColor: currentUser.color?.color || '#F97316',
            userAvatar: currentUser.avatar,
            message: inputMessage.trim(),
            timestamp: Date.now(),
        };

        console.log('Socket status:', {
            connected: socket.connected,
            id: socket.id
        });
        console.log('Sending chat message:', messageData);
        socket.emit('chat_message', messageData);
        setInputMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (isMinimized) {
            setUnreadCount(0);
        }
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isReady = currentUser && socket;

    return (
        <div className={`chat-container ${isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : ''}`}>
            <div className="chat-header">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-orange-500" />
                    <span className="font-semibold">Team Chat</span>
                    <span className="text-xs text-neutral-500">({users.length} online)</span>
                    {unreadCount > 0 && (
                        <span className="chat-badge">{unreadCount}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleExpand}
                        className="chat-header-btn"
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button
                        onClick={toggleMinimize}
                        className="chat-header-btn"
                        title={isMinimized ? "Show chat" : "Hide chat"}
                    >
                        {isMinimized ? <Maximize2 size={14} /> : <X size={14} />}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    <div className="chat-messages">
                        {!isReady ? (
                            <div className="chat-empty">
                                <MessageSquare size={32} className="text-neutral-600" />
                                <p className="text-neutral-500 text-sm mt-2">Connecting to chat...</p>
                                <p className="text-neutral-600 text-xs">Please wait</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="chat-empty">
                                <MessageSquare size={32} className="text-neutral-600" />
                                <p className="text-neutral-500 text-sm mt-2">No messages yet</p>
                                <p className="text-neutral-600 text-xs">Start chatting with your team!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOwnMessage = currentUser && msg.userId === currentUser.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`chat-message ${isOwnMessage ? 'own-message' : ''}`}
                                    >
                                        {!isOwnMessage && (
                                            <img
                                                src={msg.userAvatar}
                                                alt={msg.userName}
                                                className="chat-avatar"
                                                style={{ borderColor: msg.userColor }}
                                            />
                                        )}
                                        <div className="chat-message-content">
                                            <div className="chat-message-header">
                                                <span
                                                    className="chat-message-author"
                                                    style={{ color: msg.userColor }}
                                                >
                                                    {isOwnMessage ? 'You' : msg.userName}
                                                </span>
                                                <span className="chat-message-time">
                                                    {formatTime(msg.timestamp)}
                                                </span>
                                            </div>
                                            <div className="chat-message-text">
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="chat-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={isReady ? "Type a message..." : "Connecting..."}
                            className="chat-input"
                            maxLength={500}
                            disabled={!isReady}
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || !isReady}
                            className="chat-send-btn"
                            title="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default Chat;
