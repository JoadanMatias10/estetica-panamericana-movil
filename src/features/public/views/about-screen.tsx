import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '../styles/about-screen.styles';

type Props = {
  onBack: () => void;
  onContact: () => void;
  onPrivacy: () => void;
  onFacebook: () => void;
  onInstagram: () => void;
  logo?: ImageSourcePropType;
  establishmentImage?: ImageSourcePropType;
  essence?: string;
  history?: string;
  mission?: string;
  vision?: string;
  values?: string[];
};

type SectionId = 'history' | 'mission' | 'vision';

export function AboutScreen({
  onBack,
  onContact,
  onPrivacy,
  onFacebook,
  onInstagram,
  logo,
  establishmentImage,
  essence = 'Somos un espacio dedicado a realzar tu belleza con tratamientos profesionales, productos de calidad y atención enfocada en tu cuidado personal.',
  history = 'Estética Panamericana nace con el propósito de ofrecer un espacio de belleza y cuidado personal con atención cercana y profesional.',
  mission = 'Brindar servicios de belleza de excelencia que transformen la experiencia de nuestros clientes, combinando técnicas innovadoras con un trato cálido y personalizado.',
  vision = 'Ser una estética reconocida por la calidad de sus servicios, la innovación y la confianza de nuestros clientes.',
  values = [
    'Profesionalismo',
    'Innovación',
    'Calidez',
    'Calidad',
    'Compromiso',
    'Inclusión',
  ],
}: Props) {
  const [expanded, setExpanded] = useState<SectionId | null>('mission');

  const sections = [
    {
      id: 'history' as const,
      title: 'Historia',
      icon: 'time-outline' as const,
      text: history,
    },
    {
      id: 'mission' as const,
      title: 'Misión',
      icon: 'locate-outline' as const,
      text: mission,
    },
    {
      id: 'vision' as const,
      title: 'Visión',
      icon: 'eye-outline' as const,
      text: vision,
    },
  ];

  return (
    <LinearGradient
      colors={['#FFF8FA', '#F5EFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
                name="chevron-back"
                size={23}
                color="#393746"
              />
            </Pressable>

            <Text style={styles.headerTitle}>Acerca de nosotros</Text>

            <View style={styles.headerSpacer} />
          </View>

          {establishmentImage ? (
            <Image
              source={establishmentImage}
              style={styles.establishmentImage}
              resizeMode="cover"
              accessibilityLabel="Instalaciones de Estética Panamericana"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="storefront-outline"
                size={42}
                color="#A17ACD"
              />
              <Text style={styles.placeholderText}>
                Estética Panamericana
              </Text>
            </View>
          )}

          <View style={styles.brandContainer}>
            {logo ? (
              <Image
                source={logo}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Logotipo de Estética Panamericana"
              />
            ) : (
              <Ionicons
                name="flower-outline"
                size={44}
                color="#393746"
              />
            )}

            <Text style={styles.brand}>Estética Panamericana</Text>
          </View>

          <View style={styles.essenceSection}>
            <Text style={styles.sectionTitle}>Nuestra esencia</Text>
            <Text style={styles.bodyText}>{essence}</Text>
          </View>

          <View style={styles.accordionList}>
            {sections.map((section) => {
              const isOpen = expanded === section.id;
              const isMission = section.id === 'mission';

              return (
                <View key={section.id} style={styles.accordion}>
                  <Pressable
                    onPress={() =>
                      setExpanded(isOpen ? null : section.id)
                    }
                    style={styles.accordionHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    accessibilityLabel={section.title}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        isMission && styles.pinkIconContainer,
                      ]}
                    >
                      <Ionicons
                        name={section.icon}
                        size={19}
                        color={isMission ? '#DD5AA6' : '#9660E8'}
                      />
                    </View>

                    <Text style={styles.accordionTitle}>
                      {section.title}
                    </Text>

                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={17}
                      color="#656271"
                    />
                  </Pressable>

                  {isOpen && (
                    <View style={styles.accordionBody}>
                      <Text style={styles.bodyText}>
                        {section.text}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.valuesSection}>
            <Text style={styles.sectionTitle}>Nuestros valores</Text>

            <View style={styles.valuesList}>
              {values.map((value, index) => (
                <View
                  key={`${value}-${index}`}
                  style={[
                    styles.valueBadge,
                    index % 2 === 0
                      ? styles.pinkBadge
                      : styles.purpleBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.valueText,
                      index % 2 === 0
                        ? styles.pinkText
                        : styles.purpleText,
                    ]}
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Síguenos</Text>

            <View style={styles.socialButtons}>
              <Pressable
                onPress={onFacebook}
                style={[styles.socialButton, styles.facebookButton]}
                accessibilityRole="button"
                accessibilityLabel="Abrir Facebook"
              >
                <Ionicons
                  name="logo-facebook"
                  size={16}
                  color="#9660D9"
                />
                <Text style={[styles.socialText, styles.purpleText]}>
                  Facebook
                </Text>
              </Pressable>

              <Pressable
                onPress={onInstagram}
                style={[styles.socialButton, styles.instagramButton]}
                accessibilityRole="button"
                accessibilityLabel="Abrir Instagram"
              >
                <Ionicons
                  name="logo-instagram"
                  size={17}
                  color="#DD5AA6"
                />
                <Text style={[styles.socialText, styles.pinkText]}>
                  Instagram
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.links}>
            <Pressable
              onPress={onContact}
              style={styles.linkButton}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Contacto y ubicación</Text>
              <Ionicons
                name="chevron-forward"
                size={17}
                color="#656271"
              />
            </Pressable>

            <Pressable
              onPress={onPrivacy}
              style={styles.linkButton}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Política de privacidad</Text>
              <Ionicons
                name="chevron-forward"
                size={17}
                color="#656271"
              />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}