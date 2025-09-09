// styles/searchScreen.style.js

import { StyleSheet } from 'react-native';

export const getSearchScreenStyles = theme =>
  StyleSheet.create({
    // --- Container ---
    searchContainer: {
      flex: 1,
    },

    // --- Search Input ---
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 15,
      margin: 16,
      fontSize: 16,
      color: theme.textPrimary,
      borderColor: theme.border,
      backgroundColor: theme.cardBackground,
    },

    // --- Location List ---
    listItem: {
      padding: 16,
      borderBottomWidth: 1,
      fontSize: 16,
      color: theme.textPrimary,
      borderBottomColor: theme.border,
    },

    // --- Back Button (in SearchResult) ---
    backButton: {
      padding: 16,
    },
    backButtonText: {
      color: theme.textPrimary,
      fontSize: 16,
    },
  });
