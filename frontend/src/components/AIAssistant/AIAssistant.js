import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Code, FileCode, Lightbulb, Trash2, Copy, Check, Wand2, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './AIAssistant.css';

/**
 * AI Assistant Component
 * Provides AI-powered code assistance using Google Gemini API
 */
export const AIAssistant = ({ socket, activeFile, selectedCode }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your AI coding assistant powered by **Hugging Face** (Llama 3.1). I can help you:\n\n• Explain code\n• Fix bugs\n• Suggest improvements\n• Write new code\n• Refactor existing code\n\nSelect some code and ask me anything!',
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPromptizing, setIsPromptizing] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleAIResponse = (data) => {
            setIsLoading(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response,
                timestamp: Date.now()
            }]);
        };

        const handlePromptizeResponse = (data) => {
            setIsPromptizing(false);
            if (data.success) {
                setInput(data.improvedPrompt);
            }
        };

        const handleAIError = (data) => {
            setIsLoading(false);
            setIsPromptizing(false);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Error: ${data.error}`,
                timestamp: Date.now(),
                isError: true
            }]);
        };

        socket.on('ai_response', handleAIResponse);
        socket.on('ai_promptize_response', handlePromptizeResponse);
        socket.on('ai_error', handleAIError);

        return () => {
            socket.off('ai_response', handleAIResponse);
            socket.off('ai_promptize_response', handlePromptizeResponse);
            socket.off('ai_error', handleAIError);
        };
    }, [socket]);

    const handlePromptize = () => {
        if (!input.trim() || isPromptizing || !socket) return;
        setIsPromptizing(true);
        socket.emit('ai_promptize', { prompt: input });
    };

    const sendMessage = () => {
        if (!input.trim() || isLoading || !socket) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Send to backend
        socket.emit('ai_query', {
            query: input,
            code: selectedCode || '',
            file: activeFile || '',
            context: messages.slice(-4) // Send last 4 messages for context
        });
    };

    const quickActions = [
        { icon: Code, label: 'Explain Code', prompt: 'Explain what this code does:' },
        { icon: Lightbulb, label: 'Suggest Improvements', prompt: 'Suggest improvements for this code:' },
        { icon: FileCode, label: 'Find Bugs', prompt: 'Find potential bugs in this code:' },
        { icon: Sparkles, label: 'Refactor', prompt: 'Refactor this code to be more efficient:' }
    ];

    const handleQuickAction = (prompt) => {
        if (!selectedCode) {
            alert('Please select some code first!');
            return;
        }
        setInput(`${prompt}\n\n\`\`\`\n${selectedCode}\n\`\`\``);
    };

    const copyToClipboard = (content, index) => {
        navigator.clipboard.writeText(content);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const clearChat = () => {
        if (confirm('Clear all messages?')) {
            setMessages([{
                role: 'assistant',
                content: 'Chat cleared. How can I help you?',
                timestamp: Date.now()
            }]);
        }
    };

    return (
        <div className="ai-assistant">
            <div className="ai-assistant-header">
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-orange-500" />
                    <span className="font-semibold">AI Assistant</span>
                </div>
                <button
                    onClick={clearChat}
                    className="ai-btn-icon"
                    title="Clear chat"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {selectedCode && (
                <div className="quick-actions">
                    {quickActions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickAction(action.prompt)}
                            className="quick-action-btn"
                            title={action.label}
                        >
                            <action.icon size={14} />
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="ai-messages">
                {messages.map((msg, idx) => {
                    const shareSuggestion = (content) => {
                        if (!socket) return;
                        // Extract the first code block if it's there
                        const codeMatch = /```(?:\w+)?\s*([\s\S]*?)```/.exec(content);
                        const codeToShare = codeMatch ? codeMatch[1].trim() : content;

                        socket.emit('ai_suggest_code', {
                            file: activeFile,
                            code: codeToShare,
                            description: content.split('\n')[0]
                        });
                    };

                    return (
                        <div key={idx} className={`ai-message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                            <div className="message-header">
                                <span className="message-role">
                                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                                </span>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="message-content">
                                <ReactMarkdown
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
                                                <SyntaxHighlighter
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    {...props}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                            {msg.role === 'assistant' && !msg.isError && (
                                <div className="message-actions">
                                    <button
                                        onClick={() => copyToClipboard(msg.content, idx)}
                                        className="message-copy-btn"
                                        title="Copy to clipboard"
                                    >
                                        {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                    <button
                                        onClick={() => shareSuggestion(msg.content)}
                                        className="message-share-btn"
                                        title="Suggest to Team"
                                    >
                                        <Users size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="ai-message assistant loading">
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-container">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder={isPromptizing ? "Promptizing..." : "Ask me anything... (Shift+Enter for new line)"}
                    className="ai-input"
                    rows={3}
                    disabled={isLoading || isPromptizing}
                />
                <div className="ai-input-actions">
                    <button
                        onClick={handlePromptize}
                        disabled={!input.trim() || isLoading || isPromptizing}
                        className={`promptize-btn ${isPromptizing ? 'loading' : ''}`}
                        title="Promptizer (Improve your prompt)"
                    >
                        <Wand2 size={16} />
                    </button>
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || isPromptizing}
                        className="ai-send-btn"
                        title="Send (Enter)"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>

            {!socket && (
                <div className="ai-warning">
                    ⚠️ Not connected to server. AI features unavailable.
                </div>
            )}
        </div>
    );
};

export default AIAssistant;
