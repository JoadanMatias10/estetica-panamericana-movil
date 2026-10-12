import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CatalogStatus } from '../components/catalog-status';
import type { PublicCarouselSlide, PublicPromotion } from '../models/public-content';
import { formatServicePrice, type PublicService } from '../models/public-service';
import { styles } from '../styles/public-home-screen.styles';

type Props = {
  businessName: string;
  banners: readonly PublicCarouselSlide[];
  promotions: readonly PublicPromotion[];
  featuredServices: readonly PublicService[];
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  logo?: ImageSourcePropType;
  onRetry: () => void;
  onRefresh: () => void;
  onLogin: () => void;
  onServices: () => void;
  onProducts: () => void;
  onAbout: () => void;
  onContact: () => void;
  onPrivacy: () => void;
  onPromotions: () => void;
};

const menuItems = [
  { key: 'about', title: 'Acerca de nosotros', icon: 'people-outline' },
  { key: 'contact', title: 'Contacto', icon: 'call-outline' },
  { key: 'privacy', title: 'Política de privacidad', icon: 'shield-checkmark-outline' },
  { key: 'promotions', title: 'Promociones', icon: 'gift-outline' },
] as const;

export function PublicHomeScreen({
  businessName,
  banners,
  promotions,
  featuredServices,
  isLoading,
  isRefreshing,
  error,
  logo,
  onRetry,
  onRefresh,
  onLogin,
  onServices,
  onProducts,
  onAbout,
  onContact,
  onPrivacy,
  onPromotions,
}: Props) {
  const { width } = useWindowDimensions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [failedServiceImages, setFailedServiceImages] = useState<Record<string, boolean>>({});
  const pageWidth = Math.max(1, Math.min(width, 680) - 32);

  const visibleBanner = activeBanner < banners.length ? activeBanner : 0;

  const menuActions = {
    about: onAbout,
    contact: onContact,
    privacy: onPrivacy,
    promotions: onPromotions,
  } as const;

  const openMenuItem = (key: keyof typeof menuActions) => {
    setSidebarOpen(false);
    menuActions[key]();
  };

  const refreshHome = () => {
    setFailedServiceImages({});
    onRefresh();
  };

  const renderPromotion = (promotion: PublicPromotion) => (
    <Pressable
      key={promotion.id}
      accessibilityRole="button"
      accessibilityLabel={`Consultar promoción ${promotion.title}`}
      onPress={onPromotions}
      style={({ pressed }) => [styles.promotionCard, pressed && styles.pressed]}
    >
      <View style={styles.promotionPlaceholder}>
        <Ionicons name="gift-outline" size={32} color="#934BC5" />
      </View>
      <View style={styles.promotionBody}>
        <Text style={styles.promotionBadge}>{promotion.discount || 'PROMOCIÓN'}</Text>
        <Text numberOfLines={2} style={styles.promotionTitle}>{promotion.title}</Text>
        {promotion.description ? (
          <Text numberOfLines={2} style={styles.validity}>{promotion.description}</Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
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
          <Image source={logo} style={styles.logo} resizeMode="contain" accessibilityLabel={`Logo de ${businessName}`} />
        ) : (
          <View style={styles.logoFallback}><Text style={styles.logoLetter}>P</Text></View>
        )}
        <Text numberOfLines={1} style={styles.brandName}>{businessName}</Text>

        <Pressable accessibilityRole="button" accessibilityLabel="Iniciar sesión" onPress={onLogin} style={styles.profileButton}>
          <Ionicons name="person-outline" size={20} color="#423448" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshHome} tintColor="#8B5CF6" />}
        contentContainerStyle={styles.body}
      >
        {isLoading && !banners.length && !featuredServices.length ? (
          <CatalogStatus kind="loading" title="Cargando información…" />
        ) : (
          <>
            {error ? (
              <CatalogStatus
                compact
                kind="error"
                title="No se pudo actualizar el inicio"
                message={error}
                actionLabel="Reintentar"
                onAction={onRetry}
              />
            ) : null}

            <View>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={{ width: pageWidth }}
                onMomentumScrollEnd={(event) => {
                  setActiveBanner(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
                }}
              >
                {(banners.length ? banners : [undefined]).map((slide, index) => {
                  const caption = (
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.bannerCaption}>
                      <Text style={styles.bannerTitle}>Agenda tu momento de bienestar</Text>
                      <Text style={styles.bannerSubtitle}>Tratamientos profesionales para realzar tu belleza</Text>
                    </LinearGradient>
                  );

                  return slide ? (
                    <ImageBackground
                      key={slide.id}
                      source={slide.image}
                      resizeMode="cover"
                      style={[styles.banner, { width: pageWidth }]}
                      accessibilityLabel={`Imagen promocional ${index + 1}`}
                    >
                      {caption}
                    </ImageBackground>
                  ) : (
                    <LinearGradient key="brand-banner" colors={['#DF82BA', '#8144AE']} style={[styles.banner, { width: pageWidth }]}>
                      {caption}
                    </LinearGradient>
                  );
                })}
              </ScrollView>

              {banners.length > 1 ? (
                <View style={styles.dots}>
                  {banners.map((slide, index) => (
                    <View key={slide.id} style={[styles.dot, index === visibleBanner && styles.activeDot]} />
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.buttonRow}>
              <Pressable accessibilityRole="button" onPress={onLogin} style={styles.outlineButton}>
                <Text style={styles.outlineText}>Iniciar sesión</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onServices} style={styles.gradientButton}>
                <LinearGradient colors={['#E843A0', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonFill}>
                  <Text style={styles.buttonText}>Ver servicios</Text>
                </LinearGradient>
              </Pressable>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Promociones</Text>
              <Pressable accessibilityRole="button" onPress={onPromotions} style={styles.smallButton}>
                <Text style={styles.link}>Ver todas ›</Text>
              </Pressable>
            </View>

            {promotions.length ? (
              <View style={styles.promotionRow}>{promotions.slice(0, 2).map(renderPromotion)}</View>
            ) : (
              <View style={styles.emptyInline}>
                <Ionicons name="gift-outline" size={24} color="#934BC5" />
                <Text style={styles.emptyInlineText}>No hay promociones disponibles en este momento.</Text>
              </View>
            )}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Servicios destacados</Text>
              <Pressable accessibilityRole="button" onPress={onServices} style={styles.smallButton}>
                <Text style={styles.link}>Ver todos ›</Text>
              </Pressable>
            </View>

            {featuredServices.length ? (
              <View style={styles.servicesGrid}>
                {featuredServices.map((service) => (
                  <Pressable
                    key={service.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver servicio ${service.name}`}
                    onPress={onServices}
                    style={({ pressed }) => [styles.serviceCard, pressed && styles.pressed]}
                  >
                    {service.image && !failedServiceImages[service.id] ? (
                      <Image
                        accessibilityLabel={`Imagen del servicio ${service.name}`}
                        onError={() => {
                          setFailedServiceImages((current) => ({ ...current, [service.id]: true }));
                        }}
                        resizeMode="cover"
                        source={service.image}
                        style={styles.serviceImage}
                      />
                    ) : (
                      <View style={styles.serviceImageFallback}>
                        <View style={styles.serviceIcon}>
                          <Ionicons name="sparkles-outline" size={22} color="#9454CE" />
                        </View>
                      </View>
                    )}
                    <View style={styles.serviceBody}>
                      <Text numberOfLines={2} style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.servicePrice}>Desde {formatServicePrice(service.priceFrom)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.paragraph}>No hay servicios destacados disponibles.</Text>
            )}

            <Pressable accessibilityRole="button" onPress={onProducts} style={styles.productsLink}>
              <Ionicons name="bag-outline" size={18} color="#7D3BBB" />
              <Text style={styles.productsLinkText}>Explorar catálogo de productos</Text>
              <Ionicons name="chevron-forward" size={17} color="#7D3BBB" />
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal visible={sidebarOpen} transparent animationType="fade" onRequestClose={() => setSidebarOpen(false)}>
        <View style={styles.overlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú lateral" style={StyleSheet.absoluteFill} onPress={() => setSidebarOpen(false)} />
          <SafeAreaView edges={['top', 'bottom']} style={[styles.sidebar, { width: Math.min(width * 0.85, 330) }]}>
            <ScrollView contentContainerStyle={styles.sidebarBody}>
              <View style={styles.sidebarHeading}>
                <Text style={styles.sidebarTitle}>Menú público</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setSidebarOpen(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={24} color="#423448" />
                </Pressable>
              </View>
              <Text style={styles.sidebarBrand}>{businessName}</Text>
              <Text style={styles.sidebarSubtitle}>Belleza y bienestar</Text>

              {menuItems.map((item) => (
                <Pressable key={item.key} accessibilityRole="button" onPress={() => openMenuItem(item.key)} style={styles.menuItem}>
                  <Ionicons name={item.icon} size={22} color="#9454CE" />
                  <Text style={styles.menuText}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={17} color="#927B9C" />
                </Pressable>
              ))}

              <Pressable accessibilityRole="button" onPress={() => { setSidebarOpen(false); onLogin(); }} style={styles.sidebarLogin}>
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
