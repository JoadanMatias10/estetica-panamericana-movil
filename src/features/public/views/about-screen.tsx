import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CatalogStatus } from '../components/catalog-status';
import { styles } from '../styles/about-screen.styles';

type Props = {
  actionError?: string;
  businessName: string;
  canOpenFacebook: boolean;
  canOpenInstagram: boolean;
  error?: string;
  essence: string;
  history: string;
  isLoading: boolean;
  isRefreshing: boolean;
  mission: string;
  values: readonly string[];
  vision: string;
  logo?: ImageSourcePropType;
  establishmentImage?: ImageSourcePropType;
  onBack: () => void;
  onContact: () => void;
  onPrivacy: () => void;
  onFacebook: () => void;
  onInstagram: () => void;
  onRefresh: () => void;
  onRetry: () => void;
};

type SectionId = 'history' | 'mission' | 'vision';

export function AboutScreen({
  actionError,
  businessName,
  canOpenFacebook,
  canOpenInstagram,
  error,
  essence,
  history,
  isLoading,
  isRefreshing,
  mission,
  values,
  vision,
  logo,
  establishmentImage,
  onBack,
  onContact,
  onPrivacy,
  onFacebook,
  onInstagram,
  onRefresh,
  onRetry,
}: Props) {
  const [expanded, setExpanded] = useState<SectionId | null>('mission');
  const hasContent = Boolean(essence || history || mission || vision || values.length);
  const sections = [
    { id: 'history' as const, title: 'Historia', icon: 'time-outline' as const, text: history },
    { id: 'mission' as const, title: 'Misión', icon: 'locate-outline' as const, text: mission },
    { id: 'vision' as const, title: 'Visión', icon: 'eye-outline' as const, text: vision },
  ];

  return (
    <LinearGradient colors={['#FFF8FA', '#F5EFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#9660E8" />}
        >
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backButton} hitSlop={10} accessibilityRole="button" accessibilityLabel="Volver">
              <Ionicons name="chevron-back" size={23} color="#393746" />
            </Pressable>
            <Text style={styles.headerTitle}>Acerca de nosotros</Text>
            <View style={styles.headerSpacer} />
          </View>

          {isLoading && !hasContent ? (
            <CatalogStatus kind="loading" title="Cargando información…" />
          ) : error && !hasContent ? (
            <CatalogStatus kind="error" title="No se pudo cargar la información" message={error} actionLabel="Reintentar" onAction={onRetry} />
          ) : (
            <>
              {error ? (
                <CatalogStatus compact kind="error" title="No se pudo actualizar la información" message={error} actionLabel="Reintentar" onAction={onRetry} />
              ) : null}

              {establishmentImage ? (
                <Image source={establishmentImage} style={styles.establishmentImage} resizeMode="cover" accessibilityLabel={`Instalaciones de ${businessName}`} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="storefront-outline" size={42} color="#A17ACD" />
                  <Text style={styles.placeholderText}>{businessName}</Text>
                </View>
              )}

              <View style={styles.brandContainer}>
                {logo ? (
                  <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel={`Logotipo de ${businessName}`} />
                ) : (
                  <Ionicons name="flower-outline" size={44} color="#393746" />
                )}
                <Text style={styles.brand}>{businessName}</Text>
              </View>

              <View style={styles.essenceSection}>
                <Text style={styles.sectionTitle}>Nuestra esencia</Text>
                <Text style={styles.bodyText}>{essence || 'Información no disponible.'}</Text>
              </View>

              <View style={styles.accordionList}>
                {sections.map((section) => {
                  const isOpen = expanded === section.id;
                  const isMission = section.id === 'mission';
                  return (
                    <View key={section.id} style={styles.accordion}>
                      <Pressable
                        onPress={() => setExpanded(isOpen ? null : section.id)}
                        style={styles.accordionHeader}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: isOpen }}
                        accessibilityLabel={section.title}
                      >
                        <View style={[styles.iconContainer, isMission && styles.pinkIconContainer]}>
                          <Ionicons name={section.icon} size={19} color={isMission ? '#DD5AA6' : '#9660E8'} />
                        </View>
                        <Text style={styles.accordionTitle}>{section.title}</Text>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={17} color="#656271" />
                      </Pressable>
                      {isOpen ? (
                        <View style={styles.accordionBody}>
                          <Text style={styles.bodyText}>{section.text || 'Información no disponible.'}</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <View style={styles.valuesSection}>
                <Text style={styles.sectionTitle}>Nuestros valores</Text>
                {values.length ? (
                  <View style={styles.valuesList}>
                    {values.map((value, index) => (
                      <View key={`${value}-${index}`} style={[styles.valueBadge, index % 2 === 0 ? styles.pinkBadge : styles.purpleBadge]}>
                        <Text style={[styles.valueText, index % 2 === 0 ? styles.pinkText : styles.purpleText]}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.bodyText}>Información no disponible.</Text>
                )}
              </View>

              <View style={styles.socialSection}>
                <Text style={styles.sectionTitle}>Síguenos</Text>
                <View style={styles.socialButtons}>
                  <Pressable
                    onPress={onFacebook}
                    disabled={!canOpenFacebook}
                    style={[styles.socialButton, styles.facebookButton, !canOpenFacebook && styles.disabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir Facebook"
                    accessibilityState={{ disabled: !canOpenFacebook }}
                  >
                    <Ionicons name="logo-facebook" size={16} color="#9660D9" />
                    <Text style={[styles.socialText, styles.purpleText]}>Facebook</Text>
                  </Pressable>
                  <Pressable
                    onPress={onInstagram}
                    disabled={!canOpenInstagram}
                    style={[styles.socialButton, styles.instagramButton, !canOpenInstagram && styles.disabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir Instagram"
                    accessibilityState={{ disabled: !canOpenInstagram }}
                  >
                    <Ionicons name="logo-instagram" size={17} color="#DD5AA6" />
                    <Text style={[styles.socialText, styles.pinkText]}>Instagram</Text>
                  </Pressable>
                </View>
                {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
              </View>

              <View style={styles.links}>
                <Pressable onPress={onContact} style={styles.linkButton} accessibilityRole="button">
                  <Text style={styles.linkText}>Contacto y ubicación</Text>
                  <Ionicons name="chevron-forward" size={17} color="#656271" />
                </Pressable>
                <Pressable onPress={onPrivacy} style={styles.linkButton} accessibilityRole="button">
                  <Text style={styles.linkText}>Política de privacidad</Text>
                  <Ionicons name="chevron-forward" size={17} color="#656271" />
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
