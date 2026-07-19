import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PdfViewerScreen = ({ navigation, route }) => {
  const { title, url } = route.params;

  // Use Google Docs viewer to embed PDF for cross-platform support
  const embedUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient 
          colors={['#1e1b4b', '#4c1d95', '#6d28d9']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 32 }} />
        </LinearGradient>
        
        <WebView
          source={{ uri: embedUrl }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#6d28d9" />
              <Text style={styles.loadingText}>Loading document...</Text>
            </View>
          )}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1e1b4b' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    paddingTop: 10,
    paddingBottom: 15, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  backButton: { padding: 6 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center', fontFamily: 'Inter-Bold' },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', zIndex: 99 },
  loadingText: { marginTop: 10, color: '#4b5563', fontSize: 14, fontFamily: 'Inter-Medium' }
});

export default PdfViewerScreen;
