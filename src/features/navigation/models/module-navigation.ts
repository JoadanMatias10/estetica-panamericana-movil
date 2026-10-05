import type { AppIconName } from '@/shared/types/icons';

export type ModuleId = 'public' | 'client' | 'stylist';

export type ModuleDestination = {
  description: string;
  href: string;
  icon: AppIconName;
  key: string;
  title: string;
};

export type ModuleDefinition = {
  destinations: readonly ModuleDestination[];
  headerSubtitle: string;
  headerTitle: string;
  heroDescription: string;
  heroTitle: string;
  homeHref: string;
  loginHref?: string;
};

export const moduleDefinitions: Record<ModuleId, ModuleDefinition> = {
  public: {
    headerTitle: 'Estética Panamericana',
    headerSubtitle: 'Belleza & bienestar',
    heroTitle: 'Tu momento de bienestar comienza aquí',
    heroDescription:
      'Explora la navegación pública de servicios, productos e información de la estética.',
    homeHref: '/public',
    loginHref: '/public/login',
    destinations: [
      {
        key: 'home',
        title: 'Inicio',
        description: 'Portada pública',
        href: '/public',
        icon: 'home',
      },
      {
        key: 'services',
        title: 'Servicios',
        description: 'Ruta base del catálogo de servicios',
        href: '/public/services',
        icon: 'services',
      },
      {
        key: 'products',
        title: 'Productos',
        description: 'Ruta base del catálogo de productos',
        href: '/public/products',
        icon: 'products',
      },
      {
        key: 'more',
        title: 'Más',
        description: 'Información, contacto y privacidad',
        href: '/public/more',
        icon: 'more',
      },
    ],
  },
  client: {
    headerTitle: 'Módulo cliente',
    headerSubtitle: 'Navegación personal',
    heroTitle: 'Todo tu cuidado en un solo lugar',
    heroDescription:
      'Base preparada para citas, servicios, productos y perfil, sin conectar todavía datos del servidor.',
    homeHref: '/client',
    destinations: [
      {
        key: 'home',
        title: 'Inicio',
        description: 'Resumen del cliente',
        href: '/client',
        icon: 'home',
      },
      {
        key: 'appointments',
        title: 'Citas',
        description: 'Gestión e historial de reservaciones',
        href: '/client/appointments',
        icon: 'appointments',
      },
      {
        key: 'services',
        title: 'Servicios',
        description: 'Servicios disponibles para el cliente',
        href: '/client/services',
        icon: 'services',
      },
      {
        key: 'products',
        title: 'Productos',
        description: 'Catálogo y compras del cliente',
        href: '/client/products',
        icon: 'products',
      },
      {
        key: 'profile',
        title: 'Perfil',
        description: 'Datos, preferencias y pagos',
        href: '/client/profile',
        icon: 'profile',
      },
    ],
  },
  stylist: {
    headerTitle: 'Módulo estilista',
    headerSubtitle: 'Agenda de trabajo',
    heroTitle: 'Tu jornada, organizada',
    heroDescription:
      'Base preparada para citas, agenda, servicios realizados y disponibilidad del estilista.',
    homeHref: '/stylist',
    destinations: [
      {
        key: 'home',
        title: 'Inicio',
        description: 'Resumen de la jornada',
        href: '/stylist',
        icon: 'home',
      },
      {
        key: 'appointments',
        title: 'Citas',
        description: 'Reservaciones asignadas',
        href: '/stylist/appointments',
        icon: 'appointments',
      },
      {
        key: 'agenda',
        title: 'Agenda',
        description: 'Calendario de trabajo',
        href: '/stylist/agenda',
        icon: 'agenda',
      },
      {
        key: 'services',
        title: 'Servicios',
        description: 'Historial de servicios realizados',
        href: '/stylist/services',
        icon: 'services',
      },
      {
        key: 'schedule',
        title: 'Horario',
        description: 'Disponibilidad y bloqueos',
        href: '/stylist/schedule',
        icon: 'schedule',
      },
    ],
  },
};
