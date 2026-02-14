import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Copy, Download, Search } from 'lucide-react';
import './OutputPanel.css';

/**
 * Output Console Component
 * Multi-channel output viewer for build tools, tests, language servers, etc.
 */
export const OutputPanel = ({ channels = [], activeChannel, onChannelChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const outputRef = useRef(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeChannel?.output, autoScroll]);

    const currentChannel = channels.find(c => c.id === activeChannel) || channels[0];

    const handleClear = () => {
        if (currentChannel?.onClear) {
            currentChannel.onClear();
        }
    };

    const handleCopy = () => {
        if (currentChannel?.output) {
            navigator.clipboard.writeText(currentChannel.output.join('\n'));
        }
    };

    const handleDownload = () => {
        if (currentChannel?.output) {
            const blob = new Blob([currentChannel.output.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentChannel.name}-output.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const filteredOutput = currentChannel?.output?.filter(line =>
        !searchTerm || line.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Parse ANSI color codes (basic implementation)
    const renderLine = (line, idx) => {
        // Simple ANSI color parsing
        const ansiRegex = /\x1b\[(\d+)m/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let currentColor = '';

        while ((match = ansiRegex.exec(line)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ text: line.slice(lastIndex, match.index), color: currentColor });
            }
            currentColor = getAnsiColor(match[1]);
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < line.length) {
            parts.push({ text: line.slice(lastIndex), color: currentColor });
        }

        return (
            <div key={idx} className="output-line">
                {parts.map((part, i) => (
                    <span key={i} className={part.color}>{part.text}</span>
                ))}
            </div>
        );
    };

    const getAnsiColor = (code) => {
        const colorMap = {
            '30': 'ansi-black',
            '31': 'ansi-red',
            '32': 'ansi-green',
            '33': 'ansi-yellow',
            '34': 'ansi-blue',
            '35': 'ansi-magenta',
            '36': 'ansi-cyan',
            '37': 'ansi-white',
            '90': 'ansi-bright-black',
            '91': 'ansi-bright-red',
            '92': 'ansi-bright-green',
            '93': 'ansi-bright-yellow',
            '94': 'ansi-bright-blue',
            '95': 'ansi-bright-magenta',
            '96': 'ansi-bright-cyan',
            '97': 'ansi-bright-white',
            '0': '',
        };
        return colorMap[code] || '';
    };

    return (
        <div className="output-panel">
            <div className="output-header">
                <select
                    className="channel-selector"
                    value={currentChannel?.id}
                    onChange={(e) => onChannelChange?.(e.target.value)}
                >
                    {channels.map(channel => (
                        <option key={channel.id} value={channel.id}>
                            {channel.name}
                        </option>
                    ))}
                </select>

                <div className="output-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Search output..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="output-actions">
                    <button
                        className={`action-btn ${autoScroll ? 'active' : ''}`}
                        onClick={() => setAutoScroll(!autoScroll)}
                        title={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
                    >
                        <Terminal size={14} />
                    </button>
                    <button className="action-btn" onClick={handleCopy} title="Copy output">
                        <Copy size={14} />
                    </button>
                    <button className="action-btn" onClick={handleDownload} title="Download output">
                        <Download size={14} />
                    </button>
                    <button className="action-btn" onClick={handleClear} title="Clear output">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="output-content" ref={outputRef}>
                {filteredOutput.length === 0 ? (
                    <div className="output-empty">
                        <Terminal size={32} />
                        <p>No output yet... Run a command or build to see output here.</p>
                    </div>
                ) : (
                    <>
                        {filteredOutput.map((line, idx) => renderLine(line, idx))}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>
        </div>
    );
};

export default OutputPanel;
