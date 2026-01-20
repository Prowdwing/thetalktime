import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Paperclip, X } from 'lucide-react';
import { API_URL } from '../config';
import Avatar from './Avatar';

export default function ChatRoom() {
    const { chatId } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Mentions State
    const [mentionQuery, setMentionQuery] = useState(null);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        // Load friends for mentions
        fetch(`${API_URL}/api/auth/friends`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setFriends(data || []))
            .catch(console.error);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const targetRoomId = (chatId === 'global' || chatId === '1') ? 'global' : chatId;

        fetch(`${API_URL}/api/chat/history/${targetRoomId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(console.error);

        if (socket) {
            socket.emit('join_room', targetRoomId);
        }
    }, [chatId, socket]);

    useEffect(() => {
        if (!socket) return;
        const targetRoomId = (chatId === 'global' || chatId === '1') ? 'global' : chatId;

        const handleMessage = (msg) => {
            if (msg.chat_id == targetRoomId) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on('receive_message', handleMessage);
        return () => socket.off('receive_message', handleMessage);
    }, [socket, chatId]);

    const handleFileInputChange = async (e) => {
        await handleFileUpload(e);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('attachment', file);

        try {
            const res = await fetch(`${API_URL}/api/chat/upload`, {
                method: 'POST',
                body: formData,
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setAttachment(data);
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        // Simple mention detection: last word starts with @
        const lastWord = val.split(' ').pop();
        if (lastWord && lastWord.startsWith('@')) {
            setMentionQuery(lastWord.slice(1));
        } else {
            setMentionQuery(null);
        }
    };

    const insertMention = (username) => {
        const words = inputText.split(' ');
        words.pop(); // Remove the partial @mention
        const newValue = words.join(' ') + (words.length > 0 ? ' ' : '') + `@${username} `;
        setInputText(newValue);
        setMentionQuery(null);
        fileInputRef.current?.focus(); // Keep focus (approximate)
    };

    const renderContentWithMentions = (text) => {
        if (!text) return null;
        // Split by mention regex: @username (assuming alphanumeric)
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => {
            if (part.match(/^@\w+$/)) {
                return <span key={i} className="text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-1 rounded mx-0.5">{part}</span>;
            }
            return part;
        });
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !attachment) || !socket) return;

        const targetRoomId = (chatId === 'global' || chatId === '1') ? 'global' : chatId;

        const payload = {
            chatId: targetRoomId,
            senderId: user.id,
            content: inputText,
            attachmentUrl: attachment?.url,
            attachmentType: attachment?.type,
        };

        socket.emit('send_message', payload);
        setInputText('');
        setAttachment(null);
        setMentionQuery(null);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-app)] relative">
            {/* Chat Header */}
            <div className="h-16 flex items-center px-6 bg-[var(--bg-panel)] border-b border-[var(--border)] shadow-sm z-10">
                <h2 className="font-bold text-lg">{chatId === 'global' ? '# Global Chat' : 'Chat'}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                        <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* AVATAR: Show for everyone, including ME (on right) */}
                            <Avatar user={isMe ? user : msg} size="sm" className="mt-1 flex-shrink-0" />

                            <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && <span className="text-[10px] text-[var(--text-muted)] ml-1 mb-1">{msg.displayName}</span>}

                                <div className={`px-4 py-2 rounded-2xl text-sm ${isMe
                                    ? 'bg-[var(--primary)] text-white rounded-tr-sm'
                                    : 'bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-main)] rounded-tl-sm'
                                    }`}>
                                    {msg.attachment_url && (
                                        <div className="mb-2 rounded-lg overflow-hidden mt-1 bg-black/10">
                                            {msg.attachment_type === 'image' && <img src={`${API_URL}/uploads/${msg.attachment_url}`} className="max-w-xs h-auto block" />}
                                            {msg.attachment_type === 'video' && <video src={`${API_URL}/uploads/${msg.attachment_url}`} controls className="max-w-xs h-auto block" />}
                                            {msg.attachment_type === 'audio' && <audio src={`${API_URL}/uploads/${msg.attachment_url}`} controls />}
                                        </div>
                                    )}

                                    {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{renderContentWithMentions(msg.content)}</p>}
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)] mt-1 opacity-60">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-[var(--bg-panel)] border-t border-[var(--border)] relative">
                {/* Mentions Popup */}
                {mentionQuery !== null && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-[var(--bg-panel)] border border-[var(--border)] shadow-xl rounded-xl overflow-hidden z-50">
                        {friends.filter(f => f.username.toLowerCase().includes(mentionQuery.toLowerCase()) || f.displayName.toLowerCase().includes(mentionQuery.toLowerCase())).map(friend => (
                            <button
                                key={friend.id}
                                className="w-full text-left p-3 hover:bg-[var(--bg-app)] flex items-center gap-2 transition-colors border-b border-[var(--border)] last:border-0"
                                onClick={() => insertMention(friend.username)}
                            >
                                <Avatar user={friend} size="xs" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{friend.displayName}</span>
                                    <span className="text-xs text-[var(--text-muted)]">@{friend.username}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {attachment && (
                    <div className="flex items-center gap-2 mb-3 bg-[var(--bg-app)] py-1 px-3 rounded-lg w-fit border border-[var(--border)]">
                        <span className="text-xs font-medium text-[var(--text-muted)]">{attachment.type} attached</span>
                        <button onClick={() => setAttachment(null)} className="text-[var(--text-muted)] hover:text-red-500"><X size={14} /></button>
                    </div>
                )}
                <form onSubmit={sendMessage} className="flex items-center gap-3 w-full">
                    <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept="image/*,video/*,audio/*" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-app)] rounded-full transition-colors"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        className="flex-1 bg-[var(--input-bg)] border-none rounded-xl py-3 px-5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm placeholder:text-[var(--text-muted)] transition-all font-medium"
                        placeholder="Type a message... use @ to mention"
                        value={inputText}
                        onChange={handleInputChange}
                    />
                    <button
                        type="submit"
                        className={`p-3 rounded-full transition-all ${(inputText.trim() || attachment) ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-lg hover:scale-105 active:scale-95' : 'bg-[var(--bg-app)] text-[var(--text-muted)] cursor-default'
                            }`}
                        disabled={!inputText.trim() && !attachment}
                    >
                        <Send size={18} className={inputText.trim() || attachment ? 'ml-0.5' : ''} />
                    </button>
                </form>
            </div>
        </div>
    );
}
