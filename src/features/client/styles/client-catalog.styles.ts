import { StyleSheet } from 'react-native';

import { spacing } from '@/shared/theme/tokens';

export const clientCatalogStyles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  listHeader: {
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  categoryRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  productRow: {
    gap: spacing.md,
  },
  rowSeparator: {
    height: spacing.md,
  },
});
