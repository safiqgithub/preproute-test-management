import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PenSquare, BarChart2, LogOut, Bell } from 'lucide-react';
import { Logo } from './Logo';
import { useAuthStore } from '../store';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: PenSquare, label: 'Test Creation', to: '/tests/create' },
  { icon: BarChart2, label: 'Test Tracking', to: '/dashboard' },
];

export function Sidebar() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <aside className="w-56 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-gray-100">
        <Logo />
      </div>

      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-red-500 transition-colors w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export function TopBar() {
  const { user } = useAuthStore();
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 fixed top-0 left-56 right-0 z-20">
      <div />
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-800">{user?.name || 'Admin'}</div>
            <div className="text-xs text-gray-400">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
