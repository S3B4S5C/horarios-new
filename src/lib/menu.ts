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
  { label: 'Planificación de clases', href: '/planificacion', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Disponibilidad', href: '/disponibilidad', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR','DOCENTE'] },
  { label: 'Ver horarios', href: '/horarios', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Asignación de aulas', href: '/aulas/asignacion', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Exportar horarios', href: '/exportar', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR','DOCENTE'] },
  { label: 'Configuración de calendario', href: '/calendario', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
  { label: 'Sustituciones de docentes', href: '/substituciones', roles: ['JEFE_CARRERA','VICERRECTORADO','RECTOR'] },
];
