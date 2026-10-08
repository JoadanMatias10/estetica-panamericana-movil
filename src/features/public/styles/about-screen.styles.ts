import { Platform, StyleSheet } from 'react-native';

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#393746',
  },
  establishmentImage: {
    width: '100%',
    height: 160,
    borderRadius: 15,
  },
  imagePlaceholder: {
    height: 160,
    borderRadius: 15,
    backgroundColor: '#EEE4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  placeholderText: {
    fontSize: 13,
    color: '#756183',
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 22,
    gap: 10,
  },
  logo: {
    width: 78,
    height: 58,
  },
  brand: {
    fontFamily: serif,
    fontSize: 23,
    textAlign: 'center',
    color: '#45404D',
  },
  essenceSection: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 21,
    color: '#45404D',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#767080',
  },
  accordionList: {
    gap: 10,
  },
  accordion: {
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 30,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F6F0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinkIconContainer: {
    backgroundColor: '#FDEDF6',
  },
  accordionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#45404D',
  },
  accordionBody: {
    marginHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF3',
  },
  valuesSection: {
    marginTop: 22,
  },
  valuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pinkBadge: {
    backgroundColor: '#FBE8F3',
  },
  purpleBadge: {
    backgroundColor: '#EFE6FA',
  },
  valueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pinkText: {
    color: '#C64D93',
  },
  purpleText: {
    color: '#8956CB',
  },
  socialSection: {
    marginTop: 22,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 8,
  },
  facebookButton: {
    borderColor: '#AA83DC',
    backgroundColor: '#F1EAFB',
  },
  instagramButton: {
    borderColor: '#E181B7',
    backgroundColor: '#FBE7F3',
  },
  socialText: {
    fontSize: 12,
    fontWeight: '700',
  },
  links: {
    marginTop: 22,
    gap: 9,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBE7EE',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#56515F',
  },
});