import { ModuleTabs } from '@/shared/navigation/module-tabs';

const tabs = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'services', title: 'Servicios', icon: 'services' },
  { name: 'products', title: 'Productos', icon: 'products' },
  { name: 'more', title: 'Más', icon: 'more' },
] as const;

export default function PublicTabsLayout() {
  return <ModuleTabs tabs={tabs} />;
}
