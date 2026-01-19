import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Paperclip, X } from 'lucide-react';
import { API_URL } from '../config';

export default function ChatRoom() {
    const { chatId } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // If we clicked "Global Chat" in the sidebar, the ID might be 'global'.
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

    const sendMessage = (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !attachment) || !socket) return;

        const targetRoomId = (chatId === 'global' || chatId === '1') ? 'global' : chatId;

        const payload = {
            chatId: targetRoomId,
            senderId: user.id,
            content: inputText,
            attachmentUrl: attachment?.url,
            attachmentType: attachment?.type
        };

        socket.emit('send_message', payload);
        setInputText('');
        setAttachment(null);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-app)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                        <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-sm flex-shrink-0">
                                    {msg.avatar && msg.avatar !== 'default_avatar.png' ?
                                        <img src={`${API_URL}/uploads/${msg.avatar}`} className="w-full h-full object-cover" /> :
                                        msg.displayName?.[0]
                                    }
                                </div>
                            )}

                            <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {!isMe && <span className="text-[10px] text-[var(--text-muted)] ml-1 mb-1">{msg.displayName}</span>}

                                <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${isMe
                                        ? 'bg-[var(--primary)] text-white rounded-tr-sm'
                                        : 'bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-main)] rounded-tl-sm'
                                    }`}>
                                    {msg.attachment_url && (
                                        <div className="mb-2 rounded-lg overflow-hidden mt-1">
                                            {msg.attachment_type === 'image' && <img src={`${API_URL}/uploads/${msg.attachment_url}`} className="max-w-xs h-auto rounded-lg" />}
                                            {msg.attachment_type === 'video' && <video src={`${API_URL}/uploads/${msg.attachment_url}`} controls className="max-w-xs h-auto rounded-lg" />}
                                            {msg.attachment_type === 'audio' && <audio src={`${API_URL}/uploads/${msg.attachment_url}`} controls />}
                                        </div>
                                    )}

                                    {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
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

            <div className="p-4 bg-[var(--bg-panel)] border-t border-[var(--border)]">
                {attachment && (
                    <div className="flex items-center gap-2 mb-3 bg-[var(--bg-app)] py-1 px-3 rounded-lg w-fit border border-[var(--border)]">
                        <span className="text-xs font-medium text-[var(--text-muted)]">{attachment.type} attached</span>
                        <button onClick={() => setAttachment(null)} className="text-[var(--text-muted)] hover:text-red-500"><X size={14} /></button>
                    </div>
                )}
                <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,audio/*" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-app)] rounded-full transition-colors"
                        title="Attach file"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        className="flex-1 bg-[var(--input-bg)] border-none rounded-full py-3 px-5 focus:outline-none focus:ring-1 focus:ring-[var(--border)] text-sm placeholder:text-[var(--text-muted)] transition-all shadow-sm"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                    />
                    <button
                        type="submit"
                        className={`p-3 rounded-full shadow-md transition-all ${(inputText.trim() || attachment) ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer' : 'bg-[var(--bg-app)] text-[var(--text-muted)] cursor-default'
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
