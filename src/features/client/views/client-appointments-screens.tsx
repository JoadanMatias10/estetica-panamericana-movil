import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { ClientAppointmentCard } from '@/features/client/components/client-appointment-card';
import { formatShortDate, formatSlotTime } from '@/features/client/components/client-appointment-helpers';
import { ClientChip, ClientSectionHeading, ClientTextField } from '@/features/client/components/client-controls';
import { ClientPageHeader } from '@/features/client/components/client-page-header';
import { ClientLoadingState, ClientResourceMessage } from '@/features/client/components/client-resource-state';
import { clientScreenStyles as s } from '@/features/client/styles/client-screens.styles';
import { useClientAppointmentsViewModel } from '@/features/client/view-models/use-client-appointments-view-model';
import { useClientRescheduleAppointmentViewModel } from '@/features/client/view-models/use-client-reschedule-appointment-view-model';
import { useClientScheduleAppointmentViewModel } from '@/features/client/view-models/use-client-schedule-appointment-view-model';
import { useClientStylistAvailabilityViewModel } from '@/features/client/view-models/use-client-stylist-availability-view-model';
import { AppButton } from '@/shared/components/app-button';
import { AppCard } from '@/shared/components/app-card';
import { AppScreen } from '@/shared/components/app-screen';
import { AppText } from '@/shared/components/app-text';

export function ClientAppointmentsScreen() {
  const router = useRouter();
  const vm = useClientAppointmentsViewModel();

  const requestCancellation = (id: string, serviceName: string) => Alert.alert(
    'Cancelar cita',
    `¿Deseas cancelar la cita de ${serviceName || 'este servicio'}?`,
    [
      { style: 'cancel', text: 'Conservar cita' },
      { style: 'destructive', text: 'Sí, cancelar', onPress: () => { void vm.cancelAppointment(id); } },
    ],
  );

  return (
    <AppScreen onRefresh={vm.refresh} refreshing={vm.isRefreshing}>
      <ClientPageHeader title="Mis citas" />
      <AppButton icon="appointments" label="Agendar nueva cita" onPress={() => router.push('/client/appointments/schedule')} />
      <View style={s.tabs}>
        <Pressable onPress={() => vm.setSection('upcoming')} style={[s.tab, vm.section === 'upcoming' && s.tabActive]}>
          <AppText tone={vm.section === 'upcoming' ? 'inverse' : 'muted'} variant="label">Próximas ({vm.upcomingCount})</AppText>
        </Pressable>
        <Pressable onPress={() => vm.setSection('history')} style={[s.tab, vm.section === 'history' && s.tabActive]}>
          <AppText tone={vm.section === 'history' ? 'inverse' : 'muted'} variant="label">Historial ({vm.historyCount})</AppText>
        </Pressable>
      </View>
      {vm.isLoading ? <ClientLoadingState label="Cargando tus citas..." /> : null}
      {!vm.isLoading && vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudieron cargar las citas" tone="error" /> : null}
      {vm.actionError ? <View style={s.errorBox}><AppText tone="error">{vm.actionError}</AppText></View> : null}
      {!vm.isLoading && !vm.error && !vm.appointments.length ? (
        <ClientResourceMessage actionLabel={vm.section === 'upcoming' ? 'Agendar una cita' : undefined} icon="calendar-outline" message={vm.section === 'upcoming' ? 'No tienes citas próximas.' : 'Tus citas finalizadas aparecerán aquí.'} onAction={vm.section === 'upcoming' ? () => router.push('/client/appointments/schedule') : undefined} title={vm.section === 'upcoming' ? 'Tu agenda está libre' : 'Sin historial'} />
      ) : null}
      <View style={s.list}>
        {vm.appointments.map((appointment) => (
          <ClientAppointmentCard
            appointment={appointment}
            busy={vm.busyAppointmentId === appointment.id}
            key={appointment.id}
            onCancel={(item) => requestCancellation(item.id, item.serviceName)}
            onPay={(item) => router.push({ pathname: '/client/services/payment', params: { appointmentId: item.id } })}
            onReschedule={(item) => router.push({ pathname: '/client/appointments/[id]/reschedule', params: { id: item.id } })}
          />
        ))}
      </View>
    </AppScreen>
  );
}

type ScheduleProps = { date?: string; serviceId?: string; stylistId?: string; time?: string };

export function ClientScheduleAppointmentScreen(initial: ScheduleProps) {
  const router = useRouter();
  const vm = useClientScheduleAppointmentViewModel(initial);

  const submit = async () => {
    const result = await vm.submit();
    if (!result) return;
    Alert.alert('Cita agendada', result.message || 'Tu cita se registró correctamente.', [
      { text: 'Ver mis citas', onPress: () => router.replace('/client/appointments') },
    ]);
  };

  if (vm.isLoading) return <AppScreen><ClientPageHeader back title="Agendar cita" /><ClientLoadingState label="Consultando servicios y estilistas..." /></AppScreen>;

  return (
    <AppScreen>
      <ClientPageHeader back subtitle="Elige servicio, profesional y horario" title="Agendar cita" />
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo preparar la agenda" tone="error" /> : (
        <>
          <View style={s.section}>
            <ClientSectionHeading
              action={vm.selectedService && !vm.isServicePickerOpen ? (
                <Pressable accessibilityRole="button" onPress={vm.openServicePicker}>
                  <AppText tone="primary" variant="label">Cambiar</AppText>
                </Pressable>
              ) : undefined}
              title="1. Servicio"
            />
            {vm.selectedService && !vm.isServicePickerOpen ? (
              <AppCard style={s.compactCard}>
                <AppText variant="label">{vm.selectedService.name}</AppText>
                <AppText tone="muted" variant="caption">{vm.selectedService.segment || vm.selectedService.subcategory || 'Servicio seleccionado'}</AppText>
              </AppCard>
            ) : (
              <>
                <ClientTextField
                  icon="search-outline"
                  label="Buscar servicio"
                  onChangeText={vm.setServiceQuery}
                  placeholder="Nombre del servicio"
                  value={vm.serviceQuery}
                />
                <ScrollView horizontal contentContainerStyle={s.scrollRow} keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>
                  <ClientChip label="Todos" onPress={() => vm.selectCategory('all')} selected={vm.selectedCategoryId === 'all'} />
                  {vm.categories.filter((category) => category.id !== 'all').map((category) => (
                    <ClientChip key={category.id} label={category.label} onPress={() => vm.selectCategory(category.id)} selected={vm.selectedCategoryId === category.id} />
                  ))}
                </ScrollView>
                {vm.filteredServices.length ? (
                  <ScrollView horizontal contentContainerStyle={s.scrollRow} keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>
                    {vm.filteredServices.map((service) => <ClientChip key={service.id} label={service.name} onPress={() => vm.selectService(service.id)} selected={vm.selectedServiceId === service.id} />)}
                  </ScrollView>
                ) : <AppText tone="muted">No encontramos servicios con ese filtro.</AppText>}
              </>
            )}
          </View>
          {vm.selectedService ? (
            <View style={s.section}>
              <ClientSectionHeading title="2. Estilista" />
              {vm.stylists.length > 6 ? (
                <ClientTextField
                  icon="search-outline"
                  label="Buscar estilista"
                  onChangeText={vm.setStylistQuery}
                  placeholder="Nombre del profesional"
                  value={vm.stylistQuery}
                />
              ) : null}
              {vm.filteredStylists.length ? (
                <ScrollView horizontal contentContainerStyle={s.scrollRow} keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>
                  {vm.filteredStylists.map((stylist) => <ClientChip key={stylist.id} label={stylist.name} onPress={() => vm.selectStylist(stylist.id)} selected={vm.selectedStylistId === stylist.id} />)}
                </ScrollView>
              ) : <AppText tone="muted">No encontramos estilistas con ese nombre.</AppText>}
            </View>
          ) : null}
          {vm.isLoadingAvailability ? <ClientLoadingState label="Buscando horarios..." /> : null}
          {vm.availabilityError ? <ClientResourceMessage actionLabel="Reintentar" message={vm.availabilityError} onAction={vm.retryAvailability} title="Sin disponibilidad" tone="error" /> : null}
          {!vm.isLoadingAvailability && !vm.availabilityError && vm.selectedServiceId && vm.selectedStylistId ? (
            <>
              <View style={s.section}>
                <ClientSectionHeading title="3. Fecha" />
                <ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>
                  {vm.days.filter((day) => day.slots.length).map((day) => <ClientChip key={day.date} label={formatShortDate(day.date)} onPress={() => vm.selectDate(day.date)} selected={vm.selectedDate === day.date} />)}
                </ScrollView>
                {!vm.days.some((day) => day.slots.length) ? <AppText tone="muted">No hay fechas disponibles en los próximos días.</AppText> : null}
              </View>
              <View style={s.section}>
                <ClientSectionHeading title="4. Horario" />
                {(vm.selectedDay?.slots.length ?? 0) > 6 ? (
                  <ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>
                    <ClientChip label="Todos" onPress={() => vm.selectTimePeriod('all')} selected={vm.selectedTimePeriod === 'all'} />
                    <ClientChip label="Mañana" onPress={() => vm.selectTimePeriod('morning')} selected={vm.selectedTimePeriod === 'morning'} />
                    <ClientChip label="Tarde" onPress={() => vm.selectTimePeriod('afternoon')} selected={vm.selectedTimePeriod === 'afternoon'} />
                  </ScrollView>
                ) : null}
                <ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>
                  {vm.visibleTimes.map((time) => <ClientChip key={time} label={formatSlotTime(time)} onPress={() => vm.selectTime(time)} selected={vm.selectedTime === time} />)}
                </ScrollView>
                {!vm.visibleTimes.length ? <AppText tone="muted">No hay horarios en este periodo.</AppText> : null}
              </View>
            </>
          ) : null}
          {vm.selectedTime ? <ClientTextField label="Notas para tu cita (opcional)" maxLength={200} multiline onChangeText={vm.setNotes} placeholder="Cuéntanos algún detalle importante" value={vm.notes} /> : null}
          {vm.submitError ? <View style={s.errorBox}><AppText tone="error">{vm.submitError}</AppText></View> : null}
          {vm.selectedTime ? (
            <AppCard style={s.compactCard}>
              <AppText variant="label">Resumen</AppText>
              <AppText tone="muted">{vm.selectedService?.name || 'Selecciona un servicio'} · {vm.selectedStylist?.name || 'Selecciona estilista'}</AppText>
              <AppText tone="muted">{vm.selectedDate ? formatShortDate(vm.selectedDate) : 'Elige fecha'} {vm.selectedTime ? `a las ${formatSlotTime(vm.selectedTime)}` : ''}</AppText>
            </AppCard>
          ) : null}
          <AppButton disabled={!vm.canSubmit || vm.isSubmitting} fullWidth label={vm.isSubmitting ? 'Agendando...' : 'Confirmar cita'} onPress={() => { void submit(); }} />
        </>
      )}
    </AppScreen>
  );
}

export function ClientStylistAvailabilityScreen(initial: ScheduleProps) {
  const router = useRouter();
  const vm = useClientStylistAvailabilityViewModel(initial);
  return (
    <AppScreen>
      <ClientPageHeader back subtitle="Consulta horarios antes de agendar" title="Disponibilidad" />
      {vm.isLoading ? <ClientLoadingState label="Cargando estilistas..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se pudo consultar la agenda" tone="error" /> : null}
      {!vm.isLoading && !vm.error ? (
        <>
          <View style={s.section}><ClientSectionHeading title="Estilista" /><ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>{vm.stylists.map((stylist) => <ClientChip key={stylist.id} label={stylist.name} onPress={() => vm.selectStylist(stylist.id)} selected={vm.selectedStylistId === stylist.id} />)}</ScrollView></View>
          {vm.isLoadingAvailability ? <ClientLoadingState label="Consultando horarios..." /> : (
            <>
              <View style={s.section}><ClientSectionHeading title="Fecha" /><ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>{vm.days.filter((day) => day.slots.length).map((day) => <ClientChip key={day.date} label={formatShortDate(day.date)} onPress={() => vm.selectDate(day.date)} selected={vm.selectedDate === day.date} />)}</ScrollView></View>
              <View style={s.section}><ClientSectionHeading title="Hora" /><ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>{vm.selectedDay?.slots.map((time) => <ClientChip key={time} label={formatSlotTime(time)} onPress={() => vm.selectTime(time)} selected={vm.selectedTime === time} />)}</ScrollView></View>
            </>
          )}
          <AppButton disabled={!vm.canContinue} label="Continuar para agendar" onPress={() => router.push({ pathname: '/client/appointments/schedule', params: { date: vm.selectedDate, serviceId: initial.serviceId, stylistId: vm.selectedStylistId, time: vm.selectedTime } })} />
        </>
      ) : null}
    </AppScreen>
  );
}

export function ClientRescheduleAppointmentScreen({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const vm = useClientRescheduleAppointmentViewModel(appointmentId);
  const submit = async () => {
    const result = await vm.submit();
    if (!result) return;
    Alert.alert('Cita reprogramada', result.message || 'Guardamos el nuevo horario.', [{ text: 'Aceptar', onPress: () => router.replace('/client/appointments') }]);
  };
  return (
    <AppScreen>
      <ClientPageHeader back title="Reprogramar cita" />
      {vm.isLoading ? <ClientLoadingState label="Cargando tu cita..." /> : null}
      {vm.error ? <ClientResourceMessage actionLabel="Reintentar" message={vm.error} onAction={vm.retry} title="No se puede reprogramar" tone="error" /> : null}
      {!vm.isLoading && !vm.error && vm.appointment ? (
        <>
          <AppCard style={s.compactCard}><AppText variant="subtitle">{vm.appointment.serviceName}</AppText><AppText tone="muted">Selecciona el nuevo profesional, día y horario.</AppText></AppCard>
          <View style={s.section}><ClientSectionHeading title="Estilista" /><ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>{vm.stylists.map((stylist) => <ClientChip key={stylist.id} label={stylist.name} onPress={() => vm.selectStylist(stylist.id)} selected={vm.selectedStylistId === stylist.id} />)}</ScrollView></View>
          {vm.isLoadingAvailability ? <ClientLoadingState label="Buscando horarios..." /> : (
            <>
              <View style={s.section}><ClientSectionHeading title="Nueva fecha" /><ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>{vm.days.filter((day) => day.slots.length).map((day) => <ClientChip key={day.date} label={formatShortDate(day.date)} onPress={() => vm.selectDate(day.date)} selected={vm.selectedDate === day.date} />)}</ScrollView></View>
              <View style={s.section}><ClientSectionHeading title="Nuevo horario" /><ScrollView horizontal contentContainerStyle={s.scrollRow} showsHorizontalScrollIndicator={false} style={s.horizontalScroller}>{vm.selectedDay?.slots.map((time) => <ClientChip key={time} label={formatSlotTime(time)} onPress={() => vm.selectTime(time)} selected={vm.selectedTime === time} />)}</ScrollView></View>
            </>
          )}
          {vm.submitError ? <View style={s.errorBox}><AppText tone="error">{vm.submitError}</AppText></View> : null}
          <AppButton disabled={!vm.canSubmit || vm.isSubmitting} label={vm.isSubmitting ? 'Guardando...' : 'Confirmar nuevo horario'} onPress={() => { void submit(); }} />
        </>
      ) : null}
    </AppScreen>
  );
}
