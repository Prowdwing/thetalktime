import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { API_URL } from '../config';
import Avatar from './Avatar';

export default function CreateGroupModal({ onClose, onCreated }) {
    const [name, setName] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedids, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/auth/friends`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setFriends(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const toggleFriend = (id) => {
        if (selectedids.includes(id)) {
            setSelectedIds(selectedids.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedids, id]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || selectedids.length === 0) return;

        try {
            const res = await fetch(`${API_URL}/api/chat/group`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name, participants: selectedids })
            });

            if (res.ok) {
                const newGroup = await res.json();
                onCreated(newGroup);
                onClose();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-panel)] border border-[var(--border)] w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-app)] transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-[var(--border)]">
                    <h2 className="text-xl font-bold">Create New Group</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Chat with multiple friends at once</p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <form id="create-group-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Group Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="My Awesome Group"
                                className="input"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Select Friends ({selectedids.length})</label>
                            <div className="space-y-1">
                                {loading ? (
                                    <p className="text-sm text-[var(--text-muted)]">Loading friends...</p>
                                ) : friends.length === 0 ? (
                                    <p className="text-sm text-[var(--text-muted)]">No friends found. Add some friends first!</p>
                                ) : (
                                    friends.map(friend => (
                                        <div
                                            key={friend.id}
                                            onClick={() => toggleFriend(friend.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedids.includes(friend.id)
                                                    ? 'bg-[var(--primary)]/10 border-[var(--primary)]'
                                                    : 'border-transparent hover:bg-[var(--bg-app)]'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedids.includes(friend.id)
                                                    ? 'bg-[var(--primary)] border-[var(--primary)]'
                                                    : 'border-[var(--text-muted)]'
                                                }`}>
                                                {selectedids.includes(friend.id) && <Check size={12} className="text-white" />}
                                            </div>
                                            <Avatar user={friend} size="sm" />
                                            <span className="font-medium text-sm">{friend.displayName}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-panel)] rounded-b-2xl">
                    <button
                        type="submit"
                        form="create-group-form"
                        disabled={!name.trim() || selectedids.length === 0}
                        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
}
