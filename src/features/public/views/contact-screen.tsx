import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gradients } from '@/shared/theme/tokens';

import { styles } from '../styles/contact-screen.styles';
import type { ContactSchedule } from '../models/public-contact';

type Props = {
  onBack: () => void;
  onDirections: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  address?: string;
  locationReference?: string;
  mapImage?: ImageSourcePropType;
  schedule?: ContactSchedule[];
  isOpen?: boolean;
  canDirections: boolean;
  canCall: boolean;
  canWhatsApp: boolean;
  canEmail: boolean;
  error?: string;
};

export function ContactScreen({
  onBack,
  onDirections,
  onCall,
  onWhatsApp,
  onEmail,
  address = 'Dirección pendiente de agregar.',
  locationReference,
  mapImage,
  schedule = [],
  isOpen,
  canDirections,
  canCall,
  canWhatsApp,
  canEmail,
  error,
}: Props) {
  const contactOptions = [
    {
      title: 'Llamar',
      icon: 'call-outline' as const,
      color: '#DF579F',
      background: '#FFF0F7',
      action: onCall,
      available: canCall,
    },
    {
      title: 'WhatsApp',
      icon: 'logo-whatsapp' as const,
      color: '#20AC8A',
      background: '#E8F8F2',
      action: onWhatsApp,
      available: canWhatsApp,
    },
    {
      title: 'Correo',
      icon: 'mail-outline' as const,
      color: '#9861E8',
      background: '#F3EDFC',
      action: onEmail,
      available: canEmail,
    },
  ];

  return (
    <LinearGradient
      colors={gradients.screen}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Pressable
              onPress={onBack}
              style={styles.backButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#353744"
              />
            </Pressable>

            <Text style={styles.headerTitle}>
              Contacto y ubicación
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>
            Visítanos o comunícate con nosotros
          </Text>

          <View style={styles.businessCard}>
            <View style={styles.businessIcon}>
              <Ionicons
                name="storefront-outline"
                size={23}
                color="#9861E8"
              />
            </View>

            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>
                Estética Panamericana
              </Text>

              <Text selectable style={styles.address}>
                {address}
              </Text>

              <Text style={styles.reference}>
                {locationReference || 'Referencia de ubicación pendiente.'}
              </Text>
            </View>
          </View>

          <View style={styles.mapCard}>
            {mapImage ? (
              <Image
                source={mapImage}
                style={styles.mapImage}
                resizeMode="cover"
                accessibilityLabel="Mapa de referencia de Estética Panamericana"
              />
            ) : (
              <View style={styles.mapPlaceholder}>
                <View style={styles.locationIcon}>
                  <Ionicons
                    name="location"
                    size={40}
                    color="#D952A2"
                  />
                </View>

                <Text style={styles.mapPlaceholderTitle}>
                  Ubicación del establecimiento
                </Text>

                <Text style={styles.mapPlaceholderText}>
                  Mapa de referencia pendiente de confirmar.
                </Text>
              </View>
            )}

            <Pressable
              onPress={onDirections}
              disabled={!canDirections}
              accessibilityState={{ disabled: !canDirections }}
              style={!canDirections && styles.disabled}
              accessibilityRole="button"
              accessibilityLabel="Consultar cómo llegar"
            >
              <LinearGradient
                colors={['#EC45A0', '#9453F4']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.directionsButton}
              >
                <Ionicons
                  name="navigate-outline"
                  size={19}
                  color="#FFFFFF"
                />
                <Text style={styles.directionsText}>
                  Cómo llegar
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.contactRow}>
            {contactOptions.map((option) => (
              <Pressable
                key={option.title}
                onPress={option.action}
                disabled={!option.available}
                accessibilityState={{ disabled: !option.available }}
                accessibilityRole="button"
                accessibilityLabel={option.title}
                style={({ pressed }) => [
                  styles.contactCard,
                  pressed && styles.pressed,
                  !option.available && styles.disabled,
                ]}
              >
                <View
                  style={[
                    styles.contactIcon,
                    { backgroundColor: option.background },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={23}
                    color={option.color}
                  />
                </View>

                <Text style={styles.contactTitle}>
                  {option.title}
                </Text>
                {!option.available && <Text style={styles.pending}>No disponible</Text>}
              </Pressable>
            ))}
          </View>

          {!canDirections && <Text style={styles.pendingNotice}>Datos para llegar pendientes de confirmar.</Text>}
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

          <Text style={styles.sectionTitle}>
            Horario de atención
          </Text>

          <View style={styles.scheduleCard}>
            {typeof isOpen === 'boolean' ? (
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    !isOpen && styles.closedBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      !isOpen && styles.closedDot,
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      !isOpen && styles.closedText,
                    ]}
                  >
                    {isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
                  </Text>
                </View>
              </View>
            ) : null}

            {schedule.length ? (
              schedule.map((item, index) => (
                <View
                  key={`${item.days}-${index}`}
                  style={[
                    styles.scheduleRow,
                    index > 0 && styles.scheduleDivider,
                  ]}
                >
                  <Text style={styles.scheduleDays}>
                    {item.days}
                  </Text>
                  <Text style={styles.scheduleHours}>
                    {item.hours}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.scheduleEmpty}>
                Horario pendiente de agregar.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
