import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (name) => {
    const icons = {
      'Cardiology': 'heart',
      'Neurology': 'brain',
      'Pediatrics': 'people',
      'Surgery': 'medkit',
      'General': 'medical'
    };
    return icons[name] || 'book';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Categories</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <View style={styles.categoriesGrid}>
            {(categories || []).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => navigation.navigate('Category', { category })}
              >
                <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.categoryGradient}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryIconContainer}>
                      <Ionicons name={getCategoryIcon(category.name)} size={28} color="#1e3a8a" />
                    </View>
                    <View style={styles.questionCountBadge}>
                      <Text style={styles.questionCountText}>
                        {category._count?.questions || 0} Qs
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.categoryTitle} numberOfLines={2}>
                    {category.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', fontFamily: 'Inter-Bold' },
  content: { flex: 1, padding: 20 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#6b7280', fontSize: 16, fontFamily: 'Inter-Medium' },
  categoriesGrid: { gap: 12 },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryGradient: { padding: 16, borderRadius: 16 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  categoryIconContainer: { width: 48, height: 48, backgroundColor: '#eff6ff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  questionCountBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  questionCountText: { fontSize: 12, color: '#4b5563', fontFamily: 'Inter-Medium' },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', fontFamily: 'Inter-Bold' },
});

export default CategoriesScreen;
