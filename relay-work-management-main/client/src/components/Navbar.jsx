import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/relay_logo.png';

function Navbar({ userName, role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const isAdmin = role === 'admin';

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-purple-100/80 sticky top-0 z-50 px-6 py-3.5 shadow-sm">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img src={logoImg} alt="Relay OS" className="w-10 h-10 rounded-2xl shadow-md object-cover border border-purple-200 group-hover:scale-105 transition-transform" />
          <div>
            <span className="font-extrabold text-xl tracking-tight text-purple-950">
              Relay <span className="text-purple-600 font-semibold text-sm">OS</span>
            </span>
          </div>
        </div>

        {/* Center Pill Nav Bar */}
        <div className="hidden md:flex items-center bg-purple-50/60 p-1.5 rounded-full border border-purple-100/60 text-sm font-medium">
          <button 
            onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
            className={`px-5 py-1.5 rounded-full transition-all ${
              location.pathname === '/dashboard' || location.pathname === '/admin'
                ? 'bg-purple-700 text-white font-semibold shadow-md shadow-purple-700/30' 
                : 'text-purple-800/70 hover:text-purple-950'
            }`}
          >
            • Dashboard
          </button>
          <span className="px-4 py-1.5 text-purple-900/60 cursor-default">Employees</span>
          <span className="px-4 py-1.5 text-purple-900/60 cursor-default">Performance</span>
          <span className="px-4 py-1.5 text-purple-900/60 cursor-default">Attendance</span>
          <span className="px-4 py-1.5 text-purple-900/60 cursor-default">Analytics</span>
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm border border-purple-200">
            🔔
          </div>

          <div className="flex items-center gap-3 bg-purple-50/80 border border-purple-100 px-3.5 py-1.5 rounded-full">
            <div className="w-7 h-7 bg-purple-700 text-white rounded-full flex items-center justify-center font-bold text-xs">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-purple-950 leading-tight">{userName}</p>
              <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">{role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-purple-100 hover:bg-red-500 hover:text-white text-purple-700 transition-colors text-xs font-bold px-3.5 py-2 rounded-full border border-purple-200"
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;