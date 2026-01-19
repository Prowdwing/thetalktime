import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Moon, Sun, User, MessageSquare, Users, Settings, Plus, Hash } from 'lucide-react';
import { API_URL } from '../config';
import Avatar from './Avatar';

export default function Layout() {
    const { user, logout, theme, toggleTheme } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('chats');
    const [rooms, setRooms] = useState([]);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        if (!user) return;

        fetch(`${API_URL}/api/chat/rooms`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setRooms(data || []))
            .catch(console.error);

        fetch(`${API_URL}/api/auth/friends`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setFriends(data || []))
            .catch(console.error);

    }, [user, activeTab]);

    useEffect(() => {
        if (!socket) return;
        socket.on('private_chat_started', ({ chatId }) => {
            fetch(`${API_URL}/api/chat/rooms`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => setRooms(data || []));
        });
        return () => socket.off('private_chat_started');
    }, [socket]);

    return (
        <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans">
            <aside className="w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-panel)] flex flex-col z-20 shadow-lg">
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar user={user} size="md" />
                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm leading-tight">{user?.displayName}</h3>
                            <p className="text-[11px] text-[var(--text-muted)]">@{user?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button onClick={() => navigate('/profile')} className="p-2 rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                <div className="px-5 pb-2">
                    <div className="flex p-1 bg-[var(--bg-app)] rounded-xl border border-[var(--border)]">
                        <button
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'chats' ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            Chats
                        </button>
                        <button
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'friends' ? 'bg-[var(--bg-panel)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            onClick={() => setActiveTab('friends')}
                        >
                            Friends
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {activeTab === 'chats' && rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => navigate(`/chat/${room.id}`)}
                            className="w-full text-left p-3 rounded-xl hover:bg-[var(--bg-app)] flex items-center gap-3 transition-colors group"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${room.type === 'public' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                                {room.type === 'public' ? <Hash size={18} /> : <MessageSquare size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate text-[var(--text-main)]">{room.name || `Chat #${room.id}`}</p>
                                <p className="text-[11px] text-[var(--text-muted)] capitalize">{room.type}</p>
                            </div>
                        </button>
                    ))}

                    {activeTab === 'friends' && (
                        <>
                            <button onClick={() => navigate('/friends')} className="w-full p-2 mb-2 text-xs font-medium text-[var(--primary)] border border-dashed border-[var(--primary)]/30 rounded-xl hover:bg-[var(--primary)]/5 flex items-center justify-center gap-2 transition-colors">
                                <Plus size={14} /> Add Friend
                            </button>
                            {friends.map(friend => (
                                <div key={friend.id} className="w-full p-2 rounded-xl hover:bg-[var(--bg-app)] flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={friend} size="sm" />
                                        <span className="font-medium text-sm text-[var(--text-main)]">{friend.displayName}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            socket.emit('start_private_chat', { userA: user.id, userB: friend.id });
                                            setActiveTab('chats');
                                        }}
                                        className="p-2 rounded-full hover:bg-[var(--bg-panel)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all scale-90 active:scale-95"
                                    >
                                        <MessageSquare size={16} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-[var(--border)]">
                    <button onClick={logout} className="flex items-center gap-2 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors w-full justify-center py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg">
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            <main className="flex-1 relative flex flex-col bg-[var(--bg-app)]">
                <Outlet />
            </main>
        </div>
    );
}
