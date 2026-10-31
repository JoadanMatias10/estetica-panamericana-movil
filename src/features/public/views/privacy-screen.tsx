import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { gradients, palette } from '@/shared/theme/tokens';

import type { PrivacyPolicy } from '../models/privacy-policy';
import { styles } from '../styles/privacy-screen.styles';

export type PrivacyScreenProps = {
  policy: PrivacyPolicy;
  errorMessage?: string;
  isOpening?: boolean;
  onBack: () => void;
  onDeleteAccount: () => void;
  onOpenWebsite: () => void;
};

export function PrivacyScreen({ policy, errorMessage, isOpening = false, onBack, onDeleteAccount, onOpenWebsite }: PrivacyScreenProps) {
  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" accessibilityRole="button" hitSlop={8} onPress={onBack} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={palette.text} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>{policy.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <View style={styles.shieldIcon}><Ionicons name="shield-checkmark-outline" size={28} color={palette.secondary} /></View>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>{policy.companyName}</Text>
              <Text style={styles.introText}>{policy.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.lastUpdated}>Última actualización: {policy.updatedAtText}</Text>
          <Text selectable style={styles.body}>{policy.introduction}</Text>

          <View style={styles.contactCard}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Contacto de privacidad</Text>
            <Text selectable style={styles.body}>{policy.contact.email}</Text>
            <Text selectable style={styles.body}>{policy.contact.phone}</Text>
            <Text selectable style={styles.body}>{policy.contact.address}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isOpening, disabled: isOpening }}
            disabled={isOpening}
            onPress={onOpenWebsite}
            style={({ pressed }) => [styles.primaryButton, isOpening && styles.disabled, pressed && styles.pressed]}>
            {isOpening ? <ActivityIndicator color={palette.white} size="small" /> : <Ionicons name="open-outline" size={18} color={palette.white} />}
            <Text style={styles.primaryButtonText}>{isOpening ? 'Abriendo…' : 'Ver página web pública'}</Text>
          </Pressable>
          {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

          {policy.sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
              {section.paragraphs.map((paragraph, index) => <Text key={index} selectable style={styles.body}>{paragraph}</Text>)}
              {section.items?.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text selectable style={[styles.body, styles.listCopy]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          <Pressable accessibilityRole="button" onPress={onDeleteAccount} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Ionicons name="trash-outline" size={18} color={palette.secondary} />
            <Text style={styles.secondaryButtonText}>Solicitar eliminación de cuenta</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
