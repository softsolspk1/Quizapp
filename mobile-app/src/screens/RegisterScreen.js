import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    doctorName: '',
    designation: '',
    highestQualification: '',
    specialty: '',
    hospitalName: '',
    pmdcNumber: '',
    city: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  
  // Complaint Modal state
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintData, setComplaintData] = useState({
    doctorName: '',
    city: '',
    email: '',
    phoneNumber: '',
    complaint: ''
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const { register } = useAuth();

  const specialtyOptions = [
    'Cardiology',
    'Dermatology',
    'Endocrinology & Diabetes',
    'ER',
    'Gastroenterology',
    'Gynaecology',
    'Internal Medicine',
    'Nephrology',
    'Neurology',
    'Orthopaedic',
    'Paediatrics',
    'Psychiatry',
    'Pulmonology'
  ];

  const designationOptions = [
    'Professor',
    'Associate Professor',
    'Assitant Professor',
    'Consultant',
    'Post Graduate',
    'General Physician',
    'GP'
  ];

  const cityOptions = [
    'Abbottabad', 'Bahawalpur', 'Chiniot', 'Dera Ghazi Khan', 'Dera Ismail Khan',
    'Faisalabad', 'Gilgit', 'Gujranwala', 'Gujrat', 'Hyderabad',
    'Islamabad', 'Jacobabad', 'Jhang', 'Jhelum', 'Karachi',
    'Kasur', 'Khairpur', 'Lahore', 'Larkana', 'Mardan',
    'Mingora', 'Mirpur Khas', 'Multan', 'Muzaffarabad', 'Nawabshah',
    'Okara', 'Peshawar', 'Quetta', 'Rahim Yar Khan', 'Rawalpindi',
    'Sadiqabad', 'Sahiwal', 'Sargodha', 'Sheikhupura', 'Shikarpur',
    'Sialkot', 'Sukkur', 'Vehari'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecialtySelect = (specialty) => {
    setFormData(prev => ({ ...prev, specialty }));
    setShowSpecialtyModal(false);
  };

  const handleDesignationSelect = (designation) => {
    setFormData(prev => ({ ...prev, designation }));
    setShowDesignationModal(false);
  };

  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setShowCityModal(false);
  };

  const validateForm = () => {
    const requiredFields = [
      'doctorName', 'designation', 'highestQualification', 'specialty', 'hospitalName',
      'pmdcNumber', 'city', 'phoneNumber', 'email', 'password'
    ];

    const isComplete = requiredFields.every(field => formData[field].trim() !== '');
    if (!isComplete) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const success = await register(registerData);
      
      if (success) {
        Alert.alert(
          'Registration Successful',
          'Thank you for SignUp. Your Account is under admin approval.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const submitComplaint = async () => {
    const { doctorName, city, email, phoneNumber, complaint } = complaintData;
    if (!doctorName || !city || !email || !phoneNumber || !complaint) {
      Alert.alert('Error', 'Please fill in all complaint fields');
      return;
    }
    
    setSubmittingComplaint(true);
    try {
      const response = await fetch(`${require('../config').API_URL}/api/support/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintData)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Complaint submitted successfully');
        setShowComplaintModal(false);
        setComplaintData({ doctorName: '', city: '', email: '', phoneNumber: '', complaint: '' });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1e1b4b', '#4c1d95', '#6d28d9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the medical quiz community</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Doctor Name"
                placeholderTextColor="#9ca3af"
                value={formData.doctorName}
                onChangeText={(value) => handleInputChange('doctorName', value)}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowDesignationModal(true)}
            >
              <Ionicons name="briefcase-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <Text style={[styles.input, !formData.designation && styles.placeholder]}>
                {formData.designation || 'Designation'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Ionicons name="school-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Highest Qualification"
                placeholderTextColor="#9ca3af"
                value={formData.highestQualification}
                onChangeText={(value) => handleInputChange('highestQualification', value)}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowSpecialtyModal(true)}
            >
              <Ionicons name="medical-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <Text style={[styles.input, !formData.specialty && styles.placeholder]}>
                {formData.specialty || 'Specialty'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Hospital Name"
                placeholderTextColor="#9ca3af"
                value={formData.hospitalName}
                onChangeText={(value) => handleInputChange('hospitalName', value)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="PMDC Number"
                placeholderTextColor="#9ca3af"
                value={formData.pmdcNumber}
                onChangeText={(value) => handleInputChange('pmdcNumber', value)}
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setShowCityModal(true)}
            >
              <Ionicons name="location-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <Text style={[styles.input, !formData.city && styles.placeholder]}>
                {formData.city || 'City'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#9ca3af"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#9ca3af"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setShowComplaintModal(true)}>
              <Text style={{ color: '#ef4444', textDecorationLine: 'underline', fontSize: 14 }}>Have an issue? Submit a Complaint</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Image
            source={require('../../assets/zeegap.jpeg')}
            style={styles.footerImage}
            resizeMode="contain"
          />
        </View>
      </KeyboardAvoidingView>

      {/* Complaint Modal */}
      <Modal
        visible={showComplaintModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComplaintModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Submit Complaint</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Doctor Name"
              value={complaintData.doctorName}
              onChangeText={(val) => setComplaintData(prev => ({ ...prev, doctorName: val }))}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="City"
              value={complaintData.city}
              onChangeText={(val) => setComplaintData(prev => ({ ...prev, city: val }))}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Email Address"
              keyboardType="email-address"
              value={complaintData.email}
              onChangeText={(val) => setComplaintData(prev => ({ ...prev, email: val }))}
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={complaintData.phoneNumber}
              onChangeText={(val) => setComplaintData(prev => ({ ...prev, phoneNumber: val }))}
            />
            <TextInput
              style={[styles.input, { marginTop: 10, height: 100, textAlignVertical: 'top' }]}
              placeholder="Your Complaint"
              multiline
              value={complaintData.complaint}
              onChangeText={(val) => setComplaintData(prev => ({ ...prev, complaint: val }))}
            />

            <TouchableOpacity 
              style={[styles.registerButton, { marginTop: 20 }, submittingComplaint && styles.registerButtonDisabled]}
              onPress={submitComplaint}
              disabled={submittingComplaint}
            >
              <Text style={styles.registerButtonText}>{submittingComplaint ? 'Submitting...' : 'Submit Complaint'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ marginTop: 15, alignItems: 'center' }}
              onPress={() => setShowComplaintModal(false)}
            >
              <Text style={{ color: '#6b7280', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Specialty Modal */}
      <Modal
        visible={showSpecialtyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecialtyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Specialty</Text>
            <FlatList
              data={specialtyOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSpecialtySelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSpecialtyModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Designation Modal */}
      <Modal
        visible={showDesignationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDesignationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Designation</Text>
            <FlatList
              data={designationOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleDesignationSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDesignationModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal
        visible={showCityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCityModal(false);
          setCitySearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select City</Text>
            
            <View style={[styles.inputContainer, { marginBottom: 15 }]}>
              <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingVertical: 10 }]}
                placeholder="Search city..."
                placeholderTextColor="#9ca3af"
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                autoCapitalize="words"
              />
            </View>

            <FlatList
              data={cityOptions.filter(city => city.toLowerCase().includes(citySearchQuery.toLowerCase()))}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    handleCitySelect(item);
                    setCitySearchQuery('');
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>No cities found.</Text>
              }
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowCityModal(false);
                setCitySearchQuery('');
              }}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 15,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    padding: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: 'Inter-Medium',
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: '#6d28d9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 22,
    shadowColor: '#6d28d9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    color: '#db2777',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerImage: {
    width: 220,
    height: 110,
  },
  placeholder: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter-Regular',
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
});

export default RegisterScreen;


