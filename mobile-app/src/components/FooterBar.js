import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppBanner from './AppBanner';

const FooterBar = ({ location = "footer" }) => {
  return (
    <View style={styles.footerContainer}>
      <AppBanner location={location} />
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#f3f4f6'
  }
});

export default FooterBar;
