// components/ErrorMessage.js

import { Text } from 'react-native';
import { styles } from '../styles/styles';

const ErrorMessage = ({ message }) => (
  <Text style={styles.error}>{message}</Text>
);

export default ErrorMessage;