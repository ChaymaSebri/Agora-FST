import { LayoutDashboard, Users, FolderOpen, Calendar, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registrations', label: 'Inscriptions', icon: CheckCircle },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'projects', label: 'Projets', icon: FolderOpen },
    { id: 'events', label: 'Événements', icon: Calendar },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside className="sticky top-20 h-[calc(100vh-5rem)] w-64 shrink-0 border-r border-gray-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">FST Agora</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-200 p-4 bg-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
      </div>
    </aside>
  );
}
