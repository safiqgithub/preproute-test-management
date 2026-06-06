import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar, TopBar } from './Sidebar';
import { useAuthStore } from '../store';

export function Layout() {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56">
        <TopBar />
        <main className="pt-14 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
