import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthPage from './components/Auth';
import Layout from './components/Layout';
import ChatRoom from './components/ChatRoom';
import Profile from './components/Profile';
import FriendList from './components/FriendList';

function ProtectedRoute({ children }) {
    const { user, loading, token } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!token) return <Navigate to="/auth" />;
    return children;
}

function AppContent() {
    return (
        <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-main)]">thetalktime</h2>
                        <p>Select a chat to start talking</p>
                    </div>
                } />
                <Route path="chat/:chatId" element={<ChatRoom />} />
                <Route path="profile" element={<Profile />} />
                <Route path="friends" element={<FriendList />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SocketProvider>
                    <AppContent />
                </SocketProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
