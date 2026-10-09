import { Outlet } from 'react-router-dom';
import { SideNav } from './components/SideNav';

export function TeacherLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
