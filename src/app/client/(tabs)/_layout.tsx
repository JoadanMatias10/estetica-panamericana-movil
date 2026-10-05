import { ModuleTabs } from '@/shared/navigation/module-tabs';

const tabs = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'appointments', title: 'Citas', icon: 'appointments' },
  { name: 'services', title: 'Servicios', icon: 'services' },
  { name: 'products', title: 'Productos', icon: 'products' },
  { name: 'profile', title: 'Perfil', icon: 'profile' },
] as const;

export default function ClientTabsLayout() {
  return <ModuleTabs tabs={tabs} />;
}
