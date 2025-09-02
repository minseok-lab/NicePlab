// styles/globalStyles.js
import { StyleSheet } from 'react-native';

export const getGlobalStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  logo: {
    width: 168.5,
    height: 27.5,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 30,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 12,
    textAlign: 'left',
    color: theme.textPrimary,
    marginHorizontal: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 80,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  footerContainer: {
    marginBottom: 0,
    marginHorizontal: 20,
  },
  footerText: {
    fontSize: 10,
    color: theme.white,
  },
  error: {
    color: theme.error,
    textAlign: 'center',
    marginTop: 48,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
    color: theme.textSecondary,
  },
});