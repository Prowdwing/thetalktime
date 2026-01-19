import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { API_URL } from '../config';

export default function FriendList() {
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const token = localStorage.getItem('token');

    const fetchRequests = () => {
        fetch(`${API_URL}/api/auth/friend-requests`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm) return;
        fetch(`${API_URL}/api/auth/search?q=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setSearchResults(data))
            .catch(console.error);
    };

    const sendRequest = (receiverId) => {
        fetch(`${API_URL}/api/auth/friend-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ receiverId })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || data.error);
            });
    };

    const respondRequest = (requestId, action) => {
        fetch(`${API_URL}/api/auth/friend-request/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ requestId, action })
        })
            .then(res => res.json())
            .then(() => fetchRequests());
    };

    return (
        <div className="p-8 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold mb-6">Manage Friends</h2>

            {/* Friend Requests */}
            {requests.length > 0 && (
                <div className="mb-8 p-4 bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--primary)]">Pending Requests</h3>
                    <div className="space-y-2">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-3 bg-[var(--bg-app)] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        {req.avatar && req.avatar !== 'default_avatar.png' ?
                                            <img src={`${API_URL}/uploads/${req.avatar}`} className="w-full h-full object-cover" /> : null}
                                    </div>
                                    <div>
                                        <p className="font-medium">{req.displayName}</p>
                                        <p className="text-xs text-[var(--text-muted)]">@{req.username}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => respondRequest(req.id, 'accept')} className="p-2 bg-[var(--success)] text-white rounded-full hover:opacity-90"><Check size={16} /></button>
                                    <button onClick={() => respondRequest(req.id, 'reject')} className="p-2 bg-[var(--error)] text-white rounded-full hover:opacity-90"><X size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Friend */}
            <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border)] shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Add Friend</h3>
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Search by username..."
                        className="input flex-1"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary"><Search size={20} /></button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map(user => (
                        <div key={user.id} className="p-4 border border-[var(--border)] rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {user.avatar && user.avatar !== 'default_avatar.png' ?
                                        <img src={`${API_URL}/uploads/${user.avatar}`} className="w-full h-full object-cover" /> :
                                        <div className="flex items-center justify-center h-full w-full">{user.displayName[0]}</div>
                                    }
                                </div>
                                <div>
                                    <p className="font-medium">{user.displayName}</p>
                                    <p className="text-xs text-[var(--text-muted)]">@{user.username}</p>
                                </div>
                            </div>
                            <button onClick={() => sendRequest(user.id)} className="btn btn-secondary text-xs px-3 py-2">
                                <UserPlus size={16} className="mr-1" /> Add
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
