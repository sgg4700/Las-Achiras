
import React, { useState } from 'react';
import { ADMIN_CREDENTIALS } from './constants';
import PublicHome from './pages/PublicHome';
import AdminDashboard from './pages/AdminDashboard';
import ChatBot from './components/ChatBot';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'public' | 'login' | 'admin'>('public');
  const [loginCreds, setLoginCreds] = useState({ u: '', p: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const username = loginCreds.u.trim();
    const password = loginCreds.p.trim();

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setView('admin');
      setLoginCreds({ u: '', p: '' });
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  return (
    <div className="antialiased text-gray-900 bg-gray-50 min-h-screen">
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setView('public')}>
              <span className="text-xl font-bold text-brand-600 tracking-tight">Quinta Las Achiras</span>
            </div>
            <div>
              {view === 'public' && (
                 <button 
                  onClick={() => setView('login')} 
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Propietario
                </button>
              )}
              {view === 'admin' && (
                 <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Modo Administración</span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        {view === 'public' && (
          <>
            <PublicHome />
            <ChatBot />
          </>
        )}

        {view === 'login' && (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Acceso Admin</h2>
              {loginError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center animate-fade-in">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  {loginError}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                    value={loginCreds.u}
                    onChange={e => setLoginCreds({...loginCreds, u: e.target.value})}
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input 
                    type="password" 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-brand-500 outline-none"
                    value={loginCreds.p}
                    onChange={e => setLoginCreds({...loginCreds, p: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded font-semibold hover:bg-brand-700 transition">Entrar</button>
              </form>
              <button onClick={() => setView('public')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900">Volver</button>
            </div>
          </div>
        )}

        {view === 'admin' && <AdminDashboard onLogout={() => setView('public')} />}
      </main>

      {view === 'public' && (
        <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Quinta Las Achiras - Funes.</p>
        </footer>
      )}
    </div>
  );
};

export default App;
