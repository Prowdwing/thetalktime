import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Moon, Sun, User, MessageSquare, Users, Settings, Plus, Hash } from 'lucide-react';
import { API_URL } from '../config';
import Avatar from './Avatar';
import CreateGroupModal from './CreateGroupModal';

export default function Layout() {
    const { user, logout, theme, toggleTheme } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('chats');
    const [rooms, setRooms] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [pendingRequests, setPendingRequests] = useState(0);

    // Initial Fetch
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

        fetch(`${API_URL}/api/auth/friend-requests`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setPendingRequests(data?.length || 0))
            .catch(console.error);

    }, [user, activeTab]);

    // Socket Events
    useEffect(() => {
        if (!socket || !user) return;

        socket.emit('join_user_room', user.id);

        socket.on('private_chat_started', ({ chatId }) => {
            fetch(`${API_URL}/api/chat/rooms`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => setRooms(data || []));
        });

        socket.on('new_friend_request', () => {
            // Refresh requests count
            setPendingRequests(prev => prev + 1);
            // Optionally toast notification here
        });

        return () => {
            socket.off('private_chat_started');
            socket.off('new_friend_request');
        };
    }, [socket, user]);

    return (
        <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans">
            {showGroupModal && (
                <CreateGroupModal
                    onClose={() => setShowGroupModal(false)}
                    onCreated={(newGroup) => {
                        fetch(`${API_URL}/api/chat/rooms`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        })
                            .then(res => res.json())
                            .then(data => setRooms(data || []));
                        navigate(`/chat/${newGroup.id}`);
                    }}
                />
            )}
            <aside
                className="w-80 flex-shrink-0 flex flex-col z-20 shadow-lg"
                style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
            >
                <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar user={user} size="md" className="border-2 border-white/20" />
                        <div className="flex flex-col">
                            <h3 className="font-bold text-sm leading-tight text-white">{user?.displayName}</h3>
                            <p className="text-[11px]" style={{ color: 'var(--sidebar-muted)' }}>@{user?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={toggleTheme} className="p-2 rounded-lg transition-colors hover:bg-white/10 text-white/70 hover:text-white">
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button onClick={() => navigate('/profile')} className="p-2 rounded-lg transition-colors hover:bg-white/10 text-white/70 hover:text-white">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                <div className="px-5 pb-2">
                    <div className="flex p-1 rounded-xl border border-white/10 bg-black/10">
                        <button
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'chats' ? 'bg-white text-[var(--sidebar-bg)] shadow-sm' : 'text-white/70 hover:text-white'}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            Chats
                        </button>
                        <button
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'friends' ? 'bg-white text-[var(--sidebar-bg)] shadow-sm' : 'text-white/70 hover:text-white'} relative`}
                            onClick={() => setActiveTab('friends')}
                        >
                            Friends
                            {pendingRequests > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-[var(--sidebar-bg)]">
                                    {pendingRequests}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {activeTab === 'chats' && (
                        <>
                            <button onClick={() => setShowGroupModal(true)} className="w-full p-2 mb-2 text-xs font-medium text-white border border-dashed border-white/30 rounded-xl hover:bg-white/10 flex items-center justify-center gap-2 transition-colors">
                                <Users size={14} /> Create Group
                            </button>
                            {rooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => navigate(`/chat/${room.id}`)}
                                    className="w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors group hover:bg-white/10"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white/10 text-white`}>
                                        {room.type === 'public' ? <Hash size={18} /> : room.type === 'group' ? <Users size={18} /> : <MessageSquare size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate text-white">{room.name || `Chat #${room.id}`}</p>
                                        <p className="text-[11px] capitalize text-white/60">{room.type}</p>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    {activeTab === 'friends' && (
                        <>
                            <button onClick={() => navigate('/friends')} className="w-full p-2 mb-2 text-xs font-medium text-white border border-dashed border-white/30 rounded-xl hover:bg-white/10 flex items-center justify-center gap-2 transition-colors relative">
                                <Plus size={14} /> See Requests & Add
                                {pendingRequests > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                            </button>
                            {friends.map(friend => (
                                <div key={friend.id} className="w-full p-2 rounded-xl hover:bg-white/10 flex items-center justify-between group transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={friend} size="sm" className="border border-white/10" />
                                        <span className="font-medium text-sm text-white">{friend.displayName}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            socket.emit('start_private_chat', { userA: user.id, userB: friend.id });
                                            setActiveTab('chats');
                                        }}
                                        className="p-2 rounded-full hover:bg-white/20 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all scale-90 active:scale-95"
                                    >
                                        <MessageSquare size={16} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-white/10">
                    <button onClick={logout} className="flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white transition-colors w-full justify-center py-2 hover:bg-white/10 rounded-lg">
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
