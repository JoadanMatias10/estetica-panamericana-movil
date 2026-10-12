import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, palette } from '@/shared/theme/tokens';

import { styles } from '../styles/more-screen.styles';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type MoreScreenProps = {
  onAbout: () => void;
  onContact: () => void;
  onLogin: () => void;
  onPrivacy: () => void;
  onPromotions: () => void;
};

type MoreOption = {
  description: string;
  icon: IoniconName;
  label: string;
  onPress: () => void;
};

export function MoreScreen({
  onAbout,
  onContact,
  onLogin,
  onPrivacy,
  onPromotions,
}: MoreScreenProps) {
  const options: readonly MoreOption[] = [
    {
      description: 'Conoce nuestra esencia, historia, misión y valores.',
      icon: 'storefront-outline',
      label: 'Acerca de nosotros',
      onPress: onAbout,
    },
    {
      description: 'Consulta las ofertas disponibles en nuestros servicios.',
      icon: 'gift-outline',
      label: 'Promociones',
      onPress: onPromotions,
    },
    {
      description: 'Encuentra nuestra ubicación y medios de contacto.',
      icon: 'location-outline',
      label: 'Contacto y ubicación',
      onPress: onContact,
    },
    {
      description: 'Revisa cómo protegemos y utilizamos tus datos.',
      icon: 'shield-checkmark-outline',
      label: 'Política de privacidad',
      onPress: onPrivacy,
    },
  ];

  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>
              Más
            </Text>
            <Text style={styles.subtitle}>
              Información y opciones de Estética Panamericana.
            </Text>
          </View>

          <LinearGradient
            colors={gradients.soft}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={styles.loginCard}>
            <View style={styles.loginIcon}>
              <Ionicons name="person-outline" size={25} color={palette.primary} />
            </View>
            <View style={styles.loginCopy}>
              <Text style={styles.loginTitle}>¿Ya tienes una cuenta?</Text>
              <Text style={styles.loginDescription}>
                Inicia sesión para acceder a tus funciones personales.
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Ir a iniciar sesión"
              accessibilityRole="button"
              onPress={onLogin}
              style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}>
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              <Ionicons name="arrow-forward" size={17} color={palette.white} />
            </Pressable>
          </LinearGradient>

          <View accessibilityRole="list" style={styles.options}>
            {options.map((option) => (
              <Pressable
                accessibilityHint={option.description}
                accessibilityLabel={option.label}
                accessibilityRole="button"
                key={option.label}
                onPress={option.onPress}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={22} color={palette.secondary} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color={palette.textMuted} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
