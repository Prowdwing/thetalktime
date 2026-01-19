import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LogOut, Moon, Sun, User, MessageSquare, Users, Settings, Plus } from 'lucide-react';
import { API_URL } from '../config';

export default function Layout() {
    const { user, logout, theme, toggleTheme } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'friends'
    const [rooms, setRooms] = useState([]);
    const [friends, setFriends] = useState([]);

    // Fetch Rooms and Friends
    useEffect(() => {
        if (!user) return;

        // Fetch Rooms
        fetch(`${API_URL}/api/chat/rooms`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setRooms(data || []))
            .catch(console.error);

        // Fetch Friends
        fetch(`${API_URL}/api/auth/friends`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => setFriends(data || []))
            .catch(console.error);

    }, [user, activeTab]); // Refresh when tab changes to ensure up to date

    // Listen for new private chats
    useEffect(() => {
        if (!socket) return;
        socket.on('private_chat_started', ({ chatId }) => {
            // Refresh rooms
            fetch(`${API_URL}/api/chat/rooms`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => setRooms(data || []));
        });
        return () => socket.off('private_chat_started');
    }, [socket]);

    return (
        <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-panel)] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
                            {user?.avatar && user.avatar !== 'default_avatar.png' ?
                                <img src={`${API_URL}/uploads/${user.avatar}`} alt="avatar" className="w-full h-full object-cover" /> :
                                user?.displayName[0].toUpperCase()
                            }
                        </div>
                        <div>
                            <h3 className="font-bold truncate max-w-[120px]">{user?.displayName}</h3>
                            <p className="text-xs text-[var(--text-muted)]">@{user?.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]">
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button onClick={() => navigate('/profile')} className="p-2 rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)]">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-2 gap-2">
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'chats' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'}`}
                        onClick={() => setActiveTab('chats')}
                    >
                        Chats
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'friends' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-app)]'}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        Friends
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {activeTab === 'chats' && rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => navigate(`/chat/${room.id}`)}
                            className="w-full text-left p-3 rounded-xl hover:bg-[var(--bg-app)] flex items-center gap-3 transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${room.type === 'public' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                {room.type === 'public' ? <Users size={20} /> : <MessageSquare size={20} />}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{room.name || `Chat #${room.id}`}</p>
                                <p className="text-xs text-[var(--text-muted)] capitalize">{room.type}</p>
                            </div>
                        </button>
                    ))}

                    {activeTab === 'friends' && (
                        <>
                            <button onClick={() => navigate('/friends')} className="w-full p-2 mb-2 text-sm text-[var(--primary)] border border-dashed border-[var(--primary)] rounded-lg hover:bg-blue-500/5 flex items-center justify-center gap-2">
                                <Plus size={16} /> Add Friend / Manage
                            </button>
                            {friends.map(friend => (
                                <div key={friend.id} className="w-full p-3 rounded-xl hover:bg-[var(--bg-app)] flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs overflow-hidden">
                                            {friend.avatar && friend.avatar !== 'default_avatar.png' ?
                                                <img src={`${API_URL}/uploads/${friend.avatar}`} alt="avatar" className="w-full h-full object-cover" /> :
                                                friend.displayName[0]
                                            }
                                        </div>
                                        <span className="font-medium text-sm">{friend.displayName}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            socket.emit('start_private_chat', { userA: user.id, userB: friend.id });
                                            setActiveTab('chats');
                                        }}
                                        className="p-1.5 rounded-full hover:bg-[var(--primary)] hover:text-white text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MessageSquare size={16} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border)]">
                    <button onClick={logout} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative flex flex-col bg-[var(--bg-app)]">
                <Outlet />
            </main>
        </div>
    );
}
