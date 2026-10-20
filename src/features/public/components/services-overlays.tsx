import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/shared/theme/tokens';
import type { ServiceFilters } from '../models/public-service';
import { styles } from '../styles/services-screen.styles';

const brandColors = [palette.primaryBright, palette.secondaryBright] as const;

function Sheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose}
          accessibilityRole="button" accessibilityLabel="Cerrar panel" />
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.sheet} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHeading}>
              <Text accessibilityRole="header" style={styles.sheetTitle}>{title}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={24} color={palette.text} />
              </Pressable>
            </View>
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
    <LinearGradient colors={brandColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryFill}>
      <Text style={styles.primaryText}>{label}</Text>
    </LinearGradient>
  </Pressable>;
}

type FiltersProps = {
  visible: boolean;
  filters: ServiceFilters;
  onClose: () => void;
  onToggle: (key: keyof ServiceFilters) => void;
  onClear: () => void;
  onApply: () => void;
};

export function ServicesFilters({ visible, filters, onClose, onToggle, onClear, onApply }: FiltersProps) {
  const options: { key: keyof ServiceFilters; label: string }[] = [
    { key: 'affordable', label: 'Precio inicial de $500 MXN o menos' },
    { key: 'short', label: 'Duración de 45 minutos o menos' },
  ];
  return <Sheet visible={visible} title="Filtrar servicios" onClose={onClose}>
    <Text style={styles.secondaryText}>Combina estos criterios con la categoría y tu búsqueda.</Text>
    {options.map(option => <Pressable key={option.key} accessibilityRole="checkbox"
      accessibilityState={{ checked: filters[option.key] }} onPress={() => onToggle(option.key)} style={styles.filterOption}>
      <Ionicons name={filters[option.key] ? 'checkbox' : 'square-outline'} size={25} color={palette.secondaryBright} />
      <Text style={styles.optionText}>{option.label}</Text>
    </Pressable>)}
    <Pressable accessibilityRole="button" onPress={onClear} style={styles.iconButton}>
      <Text style={styles.linkText}>Limpiar filtros</Text>
    </Pressable>
    <PrimaryButton label="Aplicar filtros" onPress={onApply} />
  </Sheet>;
}
