// app/components/FooterLinks.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { THEME } from '../utils/constants';

const T = THEME.dark;

export default function FooterLinks() {
  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => Linking.openURL('https://track-your-money24.vercel.app/privacy-policy.html')}>
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>·</Text>
      <TouchableOpacity onPress={() => Linking.openURL('https://track-your-money24.vercel.app/terms-of-service.html')}>
        <Text style={styles.link}>Terms of Service</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>·</Text>
      <TouchableOpacity onPress={() => Linking.openURL('mailto:sudhanshu6105@gmail.com')}>
        <Text style={styles.link}>Contact</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: T.bg2,
    borderTopWidth: 1,
    borderTopColor: T.border,
    marginTop: 10,
    gap: 8,
  },
  link: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  separator: {
    fontSize: 12,
    color: T.text3,
  },
});
