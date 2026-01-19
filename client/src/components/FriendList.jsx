import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Avatar from './Avatar';

export default function FriendList() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [requests, setRequests] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/api/auth/friend-requests`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setRequests(data);
        } catch (err) { console.error(err); }
    };

    const handleSearch = async (val) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/auth/search?q=${val}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await res.json();
            setResults(data);
        } catch (err) { console.error(err); }
    };

    const sendRequest = async (id) => {
        await fetch(`${API_URL}/api/auth/friend-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ receiverId: id })
        });
        alert('Request sent!');
        setQuery('');
        setResults([]);
    };

    const respondRequest = async (id, action) => {
        await fetch(`${API_URL}/api/auth/friend-request/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ requestId: id, action })
        });
        fetchRequests();
    };

    return (
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Friends</h2>

            {/* Requests */}
            {requests.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Requests</h3>
                    <div className="space-y-2">
                        {requests.map(req => (
                            <div key={req.id} className="bg-[var(--bg-panel)] p-3 rounded-xl border border-[var(--border)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar user={req} size="md" />
                                    <div>
                                        <p className="font-semibold">{req.displayName}</p>
                                        <p className="text-xs text-[var(--text-muted)]">@{req.username}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => respondRequest(req.id, 'accept')} className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20"><Check size={18} /></button>
                                    <button onClick={() => respondRequest(req.id, 'reject')} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><X size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 bg-[var(--bg-panel)] p-3 rounded-xl border border-[var(--border)] mb-4">
                <Search className="text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search users by username..."
                    className="bg-transparent flex-1 outline-none"
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                {results.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 hover:bg-[var(--panel-hover)] rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <Avatar user={u} size="md" />
                            <div>
                                <p className="font-semibold">{u.displayName}</p>
                                <p className="text-xs text-[var(--text-muted)]">@{u.username}</p>
                            </div>
                        </div>
                        {u.id !== user.id && (
                            <button onClick={() => sendRequest(u.id)} className="p-2 rounded-full bg-[var(--primary)] text-white hover:opacity-90"><UserPlus size={18} /></button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
