import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '../styles/public-home-screen.styles';

type Section = 'about' | 'contact' | 'privacy' | 'promotions';

type Promotion = {
  id: string;
  title: string;
  validity: string;
  image?: ImageSourcePropType;
};

type Props = {
  onLogin: () => void;
  onServices: () => void;
  onProducts: () => void;
  onMore?: () => void;
  onAbout?: () => void;
  onContact: () => void;
  logo?: ImageSourcePropType;
  banners?: ImageSourcePropType[];
  promotions?: Promotion[];
  telefono?: string;
  correo?: string;
  direccion?: string;
  privacyText?: string;
};

const previewPromotions: Promotion[] = [
  {
    id: 'cortes',
    title: '20% en cortes',
    validity: 'Válido hasta Oct. 2026',
  },
  {
    id: 'manicure',
    title: '2×1 en manicure',
    validity: 'Fines de semana',
  },
];

const menuItems: {
  section: Section;
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    section: 'about',
    title: 'Acerca de nosotros',
    icon: 'people-outline',
  },
  {
    section: 'contact',
    title: 'Contacto',
    icon: 'call-outline',
  },
  {
    section: 'privacy',
    title: 'Política de privacidad',
    icon: 'shield-checkmark-outline',
  },
  {
    section: 'promotions',
    title: 'Promociones',
    icon: 'gift-outline',
  },
];

export function PublicHomeScreen({
  onLogin,
  onServices,
  onAbout,
  onContact,
  logo,
  banners = [],
  promotions,
  telefono,
  correo,
  direccion,
  privacyText,
}: Props) {
  const { width } = useWindowDimensions();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);

  const pageWidth = Math.min(width, 680) - 32;
  const offers = promotions ?? previewPromotions;
  const isPreview = promotions === undefined;
  const slides = banners.length ? banners : [undefined];

  function openSection(section: Section) {
    setSidebarOpen(false);

    if (section === 'about' && onAbout) {
      setActiveSection(null);
      onAbout();
      return;
    }

    if (section === 'contact') {
      setActiveSection(null);
      onContact();
      return;
    }

    setActiveSection(section);
  }

  function renderPromotion(item: Promotion, fullWidth = false) {
    return (
      <View
        key={item.id}
        style={[
          styles.promotionCard,
          fullWidth && styles.fullPromotion,
        ]}
      >
        {item.image ? (
          <Image
            source={item.image}
            resizeMode="cover"
            style={styles.promotionImage}
            accessibilityLabel={item.title}
          />
        ) : (
          <View style={styles.promotionPlaceholder}>
            <Ionicons
              name="gift-outline"
              size={32}
              color="#934BC5"
            />
          </View>
        )}

        <View style={styles.promotionBody}>
          <Text style={styles.promotionBadge}>
            {isPreview ? 'EJEMPLO' : 'PROMO'}
          </Text>
          <Text style={styles.promotionTitle}>{item.title}</Text>
          <Text style={styles.validity}>{item.validity}</Text>
        </View>
      </View>
    );
  }

  function renderSectionContent() {
    switch (activeSection) {
      case 'about':
        return (
          <>
            <Text style={styles.paragraph}>
              Estética Panamericana es un espacio dedicado a la belleza
              y el bienestar en Huejutla de Reyes, Hidalgo.
            </Text>

            <Text style={styles.contentTitle}>Nuestra misión</Text>
            <Text style={styles.paragraph}>
              Brindar atención cercana y profesional para ayudar a cada
              cliente a encontrar el cuidado que se adapte a su estilo.
            </Text>

            <Text style={styles.contentTitle}>Nuestra visión</Text>
            <Text style={styles.paragraph}>
              Ser una estética reconocida por la calidad de sus
              servicios, la confianza de sus clientes y la mejora
              continua de su atención.
            </Text>
          </>
        );

      case 'contact':
        return (
          <>
            <Text style={styles.contentTitle}>Ubicación</Text>
            <Text selectable style={styles.paragraph}>
              {direccion || 'Huejutla de Reyes, Hidalgo.'}
            </Text>

            {telefono ? (
              <>
                <Text style={styles.contentTitle}>Teléfono</Text>
                <Text selectable style={styles.paragraph}>
                  {telefono}
                </Text>
              </>
            ) : null}

            {correo ? (
              <>
                <Text style={styles.contentTitle}>
                  Correo electrónico
                </Text>
                <Text selectable style={styles.paragraph}>
                  {correo}
                </Text>
              </>
            ) : null}
          </>
        );

      case 'privacy':
        return (
          <Text style={styles.paragraph}>
            {privacyText ||
              'El aviso de privacidad estará disponible en esta sección.'}
          </Text>
        );

      case 'promotions':
        return offers.length ? (
          offers.map((item) => renderPromotion(item, true))
        ) : (
          <View style={styles.empty}>
            <Ionicons
              name="gift-outline"
              size={42}
              color="#934BC5"
            />
            <Text style={styles.contentTitle}>
              No hay promociones disponibles
            </Text>
            <Text style={styles.paragraph}>
              Regresa después para consultar nuevas ofertas.
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  const sectionTitle = menuItems.find(
    (item) => item.section === activeSection,
  )?.title;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menú lateral"
          accessibilityState={{ expanded: sidebarOpen }}
          onPress={() => setSidebarOpen(true)}
          style={styles.iconButton}
        >
          <Ionicons name="menu-outline" size={26} color="#423448" />
        </Pressable>

        {logo ? (
          <Image
            source={logo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Logo de Estética Panamericana"
          />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
        )}

        <Text style={styles.brandName}>Estética Panamericana</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          onPress={onLogin}
          style={styles.profileButton}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color="#423448"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width: pageWidth }}
            onMomentumScrollEnd={(event) => {
              setActiveBanner(
                Math.round(
                  event.nativeEvent.contentOffset.x / pageWidth,
                ),
              );
            }}
          >
            {slides.map((source, index) => {
              const caption = (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={styles.bannerCaption}
                >
                  <Text style={styles.bannerTitle}>
                    Agenda tu momento de bienestar
                  </Text>
                  <Text style={styles.bannerSubtitle}>
                    Tratamientos profesionales para realzar tu belleza
                  </Text>
                </LinearGradient>
              );

              return source ? (
                <ImageBackground
                  key={index}
                  source={source}
                  resizeMode="cover"
                  style={[styles.banner, { width: pageWidth }]}
                >
                  {caption}
                </ImageBackground>
              ) : (
                <LinearGradient
                  key={index}
                  colors={['#DF82BA', '#8144AE']}
                  style={[styles.banner, { width: pageWidth }]}
                >
                  {caption}
                </LinearGradient>
              );
            })}
          </ScrollView>

          {slides.length > 1 ? (
            <View style={styles.dots}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeBanner && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            onPress={onLogin}
            style={styles.outlineButton}
          >
            <Text style={styles.outlineText}>Iniciar sesión</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onServices}
            style={styles.gradientButton}
          >
            <LinearGradient
              colors={['#E843A0', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonFill}
            >
              <Text style={styles.buttonText}>Ver servicios</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Promociones</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => openSection('promotions')}
            style={styles.smallButton}
          >
            <Text style={styles.link}>Ver todos ›</Text>
          </Pressable>
        </View>

        {offers.length ? (
          <View style={styles.promotionRow}>
            {offers.slice(0, 2).map((item) => renderPromotion(item))}
          </View>
        ) : (
          <Text style={styles.paragraph}>
            No hay promociones disponibles.
          </Text>
        )}

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            Servicios destacados
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onServices}
            style={styles.smallButton}
          >
            <Text style={styles.link}>Ver todos ›</Text>
          </Pressable>
        </View>

        <View style={styles.servicesRow}>
          {[
            { title: 'Corte', icon: 'cut-outline' },
            { title: 'Color', icon: 'color-palette-outline' },
            { title: 'Facial', icon: 'sparkles-outline' },
          ].map((item) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={onServices}
              style={styles.serviceCard}
            >
              <View style={styles.serviceIcon}>
                <Ionicons
                  name={
                    item.icon as React.ComponentProps<
                      typeof Ionicons
                    >['name']
                  }
                  size={22}
                  color="#9454CE"
                />
              </View>

              <Text style={styles.serviceName}>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={sidebarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú lateral"
            style={StyleSheet.absoluteFill}
            onPress={() => setSidebarOpen(false)}
          />

          <SafeAreaView
            edges={['top', 'bottom']}
            style={[
              styles.sidebar,
              { width: Math.min(width * 0.85, 330) },
            ]}
          >
            <ScrollView contentContainerStyle={styles.sidebarBody}>
              <View style={styles.sidebarHeading}>
                <Text style={styles.sidebarTitle}>Menú público</Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar menú"
                  onPress={() => setSidebarOpen(false)}
                  style={styles.iconButton}
                >
                  <Ionicons name="close" size={24} color="#423448" />
                </Pressable>
              </View>

              <Text style={styles.sidebarBrand}>
                Estética Panamericana
              </Text>
              <Text style={styles.sidebarSubtitle}>
                Belleza & bienestar
              </Text>

              {menuItems.map((item) => (
                <Pressable
                  key={item.section}
                  accessibilityRole="button"
                  onPress={() => openSection(item.section)}
                  style={styles.menuItem}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color="#9454CE"
                  />
                  <Text style={styles.menuText}>{item.title}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color="#927B9C"
                  />
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setSidebarOpen(false);
                  onLogin();
                }}
                style={styles.sidebarLogin}
              >
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={activeSection !== null}
        animationType="slide"
        onRequestClose={() => setActiveSection(null)}
      >
        <SafeAreaView style={styles.screen}>
          <View style={styles.detailHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio"
              onPress={() => setActiveSection(null)}
              style={styles.iconButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#423448"
              />
            </Pressable>

            <Text style={styles.detailTitle}>{sectionTitle}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.detailBody}>
            {renderSectionContent()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}