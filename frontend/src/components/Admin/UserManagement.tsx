import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import api from '@/services/api';

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'etudiant' | 'enseignant' | 'club' | 'admin';
  clubId?: {
    _id: string;
    nom: string;
  };
  niveau?: string;
  filiere?: string;
  grade?: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
      });

      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    if (!newRole) return;

    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setEditingUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
    }
  };

  const handleDisableUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      try {
        await api.put(`/admin/users/${userId}/disable`);
        fetchUsers();
      } catch (error) {
        console.error('Erreur lors de la désactivation:', error);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'enseignant':
        return 'bg-blue-100 text-blue-800';
      case 'club':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayName = (user: User) => {
    if (user.role === 'club') {
      return user.clubId?.nom || user.email;
    }

    const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim();
    return fullName || user.email;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => {
          setRoleFilter(value);
          setPagination({ ...pagination, page: 1 });
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtre par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="etudiant">Étudiant</SelectItem>
            <SelectItem value="enseignant">Enseignant</SelectItem>
            <SelectItem value="club">Club</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Nom</th>
                <th className="text-left py-3 px-6 font-semibold">Email</th>
                <th className="text-left py-3 px-6 font-semibold">Rôle</th>
                <th className="text-left py-3 px-6 font-semibold">Détails</th>
                <th className="text-left py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    Chargement...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium">{getDisplayName(user)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{user.email}</td>
                    <td className="py-4 px-6">
                      {editingUser?._id === user._id ? (
                        <div className="flex gap-2">
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="etudiant">Étudiant</SelectItem>
                              <SelectItem value="enseignant">Enseignant</SelectItem>
                              <SelectItem value="club">Club</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRole(user._id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {user.niveau && <p className="text-xs">Niveau: {user.niveau}</p>}
                      {user.filiere && <p className="text-xs">Filière: {user.filiere}</p>}
                      {user.grade && <p className="text-xs">Grade: {user.grade}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewRole(user.role);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier le rôle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDisableUser(user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Désactiver"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Affichage {(pagination.page - 1) * pagination.limit + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.max(1, pagination.page - 1),
                })
              }
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`w-8 h-8 rounded ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.min(pagination.pages, pagination.page + 1),
                })
              }
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
