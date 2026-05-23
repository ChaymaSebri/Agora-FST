import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Teacher {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  photo?: string | null;
  fullName: string;
}

interface TeacherSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TeacherSelect: React.FC<TeacherSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Sélectionner un enseignant',
  disabled = false,
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const data = await clubDashboardApi.getAvailableTeachers();
        setTeachers(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des enseignants:', err);
        setError('Impossible de charger les enseignants');
        setTeachers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const getInitials = (nom: string, prenom: string) => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Chargement...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {error ? (
          <div className="p-2 text-sm text-red-500">{error}</div>
        ) : teachers.length === 0 ? (
          <div className="p-2 text-sm text-gray-500">Aucun enseignant disponible</div>
        ) : (
          teachers.map((teacher) => (
            <SelectItem key={teacher.id} value={teacher.id}>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={teacher.photo || undefined} alt={teacher.fullName} />
                  <AvatarFallback>{getInitials(teacher.nom, teacher.prenom)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{teacher.fullName}</span>
                  <span className="text-xs text-gray-500">{teacher.email}</span>
                </div>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
