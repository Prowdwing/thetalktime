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

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load history
    useEffect(() => {
        fetch(`${API_URL}/api/chat/history/${chatId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(console.error);

        if (socket) {
            socket.emit('join_room', chatId);
        }
    }, [chatId, socket]);

    // Listen for messages
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg) => {
            if (msg.chat_id == chatId) {
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

        const payload = {
            chatId,
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
        <div className="flex flex-col h-full relative">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden flex-shrink-0">
                                    {msg.avatar && msg.avatar !== 'default_avatar.png' ?
                                        <img src={`${API_URL}/uploads/${msg.avatar}`} className="w-full h-full object-cover" /> :
                                        <div className="w-full h-full flex items-center justify-center text-xs">{msg.displayName?.[0]}</div>
                                    }
                                </div>
                            )}
                            <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-[var(--primary)] text-white rounded-br-none' : 'bg-[var(--bg-panel)] border border-[var(--border)] rounded-bl-none'}`}>
                                {!isMe && <p className="text-xs opacity-70 mb-1">{msg.displayName}</p>}

                                {msg.attachment_url && (
                                    <div className="mb-2 rounded-lg overflow-hidden">
                                        {msg.attachment_type === 'image' && <img src={`${API_URL}/uploads/${msg.attachment_url}`} className="max-w-full h-auto" />}
                                        {msg.attachment_type === 'video' && <video src={`${API_URL}/uploads/${msg.attachment_url}`} controls className="max-w-full h-auto" />}
                                        {msg.attachment_type === 'audio' && <audio src={`${API_URL}/uploads/${msg.attachment_url}`} controls />}
                                    </div>
                                )}

                                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                <p className={`text-[10px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-[var(--text-muted)]'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[var(--bg-panel)] border-t border-[var(--border)]">
                {attachment && (
                    <div className="flex items-center gap-2 mb-2 bg-[var(--bg-app)] p-2 rounded-lg w-fit">
                        <span className="text-xs font-semibold">{attachment.type}: Attachment</span>
                        <button onClick={() => setAttachment(null)} className="text-red-500 hover:bg-red-100 rounded-full p-0.5"><X size={14} /></button>
                    </div>
                )}
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,audio/*" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-app)] rounded-full transition-colors"
                    >
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        className="flex-1 bg-[var(--bg-app)] border border-[var(--border)] rounded-full py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="p-2.5 bg-[var(--primary)] text-white rounded-full hover:bg-[var(--primary-hover)] shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                        disabled={!inputText.trim() && !attachment}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
