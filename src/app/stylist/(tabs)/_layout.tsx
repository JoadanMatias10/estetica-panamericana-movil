import { ModuleTabs } from '@/shared/navigation/module-tabs';

const tabs = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'appointments', title: 'Citas', icon: 'appointments' },
  { name: 'agenda', title: 'Agenda', icon: 'agenda' },
  { name: 'services', title: 'Servicios', icon: 'services' },
  { name: 'schedule', title: 'Horario', icon: 'schedule' },
] as const;

export default function StylistTabsLayout() {
  return <ModuleTabs tabs={tabs} />;
}
