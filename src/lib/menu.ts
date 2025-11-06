import type { UserRole } from '@/types';

export type MenuItem = { label: string; href: string; roles: UserRole[] };

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR','DOCENTE'] },
  { label: 'Asignación de roles', href: '/roles', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Docentes', href: '/docentes', roles: ['JEFE_CARRERA','VICERRECTORADO'] },
  { label: 'Asignaturas', href: '/asignaturas', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Edificios', href: '/edificios', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Ambientes', href: '/ambientes', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Bloques', href: '/configuracion/bloques', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Grupos', href: '/grupos', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Disponibilidad', href: '/disponibilidad', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR', 'DOCENTE'] },
  // TODO: Editar estos
  { label: 'Clases', href: '/planificacion', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Horarios', href: '/horarios', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Aulas', href: '/aulas/asignacion', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Exportar', href: '/exportar', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR', 'DOCENTE'] },
  { label: 'Calendario', href: '/calendario', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Substituciones', href: '/substituciones', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
];
