import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { statusLabels, type AppointmentStatus } from '../models/stylist';
import { useStylist } from './stylist-provider';

export function useStylistAppointmentDetailViewModel() {
  const { id } = useLocalSearchParams<{ id: string; }>();
  const { appointments, updateStatus, busy, refresh, refreshing } = useStylist();
  const appointment = appointments.find((item) => item.id === id);
  const [action, setAction] = useState<AppointmentStatus | 'choose' | null>(null);
  const [contact, setContact] = useState<'call' | 'message' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const isActive = appointment?.status === 'pending' || appointment?.status === 'confirmed';
  const nextStatus: AppointmentStatus = appointment?.status === 'pending' ? 'confirmed' : 'completed';
  const actionLabels = { confirmed: 'Confirmar cita', completed: 'Completar servicio', cancelled: 'Cancelar cita', pending: 'Pendiente' };
  async function performAction() {
    if (!appointment || !action || action === 'choose' || busy) return;
    setActionError('');
    try {
      await updateStatus(appointment.id, action);
      setFeedback(`Cita ${statusLabels[action].toLocaleLowerCase('es-MX')}.`);
      setAction(null);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo actualizar la cita.'); }
  }
  async function openContact() {
    if (!appointment || !contact) return;
    setActionError('');
    const phone = appointment.phone.replace(/[^\d+]/g, '');
    const url = contact === 'call' ? phone && `tel:${phone}`
      : phone ? `sms:${phone}` : appointment.email ? `mailto:${encodeURIComponent(appointment.email)}` : '';
    if (!url) { setActionError('El cliente no tiene datos de contacto disponibles.'); return; }
    try { await Linking.openURL(url); setContact(null); }
    catch { setActionError('No se pudo abrir una aplicación de contacto en este dispositivo.'); }
  }
  return {
    refresh, refreshing, appointment, action, setAction, contact, setContact, feedback, actionError, busy, isActive, nextStatus, actionLabels, performAction, openContact,
    chooseAction: (next: AppointmentStatus | 'choose') => { setActionError(''); setAction(next); },
    chooseContact: (next: 'call' | 'message') => { setActionError(''); setContact(next); }
  };
}
