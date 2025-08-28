// components/ErrorMessage.js

import { Text } from 'react-native';
import { globalStyles as styles } from '../styles';

const ErrorMessage = ({ message }) => (
  <Text style={styles.error}>{message}</Text>
);

export default ErrorMessage;