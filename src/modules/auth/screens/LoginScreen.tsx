import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AuthTemplate,
  Text,
  Input,
  Button,
  colors,
  spacing,
} from '../../../design-system';
import { ROUTES } from '../../../core/constants';
import { useLogin } from '../hooks/useLogin';
import { useForgotPassword } from '../hooks/useForgotPassword';
import {
  currentBrand,
  getCurrentBrandId,
} from '../../../core/brand/BrandConfig';
import { getBrandLogo } from '../../../core/brand/BrandAssets';

type RootStackParamList = {
  Login: undefined;
  OTP: { mobileNumber: string; installId?: string };
  Password: { mobileNumber: string; installId?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [mobileNumber, setMobileNumber] = useState('');
  const { sendOtp, isLoading, error } = useLogin();
  const { forgotPassword, isLoading: isForgotLoading } = useForgotPassword();
  const authType = currentBrand.auth.type;

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');

  const isValidMobile =
    mobileNumber.length === 10 && /^[6-9]\d{9}$/.test(mobileNumber);

  const isValidForgotMobile =
    forgotMobile.length === 10 && /^[6-9]\d{9}$/.test(forgotMobile);

  const handleGetOtp = async () => {
        console.log(
      'Current Brand in LoginScreen:',
      // currentBrand,
      // getCurrentBrandId(),
    );
    if (!isValidMobile) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number',
      );
      return;
    }

    const result = await sendOtp(mobileNumber);
    if (result.success) {
      // Navigate based on auth type
      if (authType === 'otp') {
        navigation.navigate(ROUTES.OTP as 'OTP', {
          mobileNumber,
          installId: result.installId,
        });
      } else {
        // For 'password' or 'both' auth types
        navigation.navigate(ROUTES.PASSWORD as 'Password', {
          mobileNumber,
          installId: result.installId,
        });
      }
    } else {
      Alert.alert('Error', result.message || 'Mobile number not found');
    }
  };

  const handleForgotPassword = async () => {
    if (!isValidForgotMobile) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const result = await forgotPassword(forgotMobile);
    setShowForgotModal(false);
    if (result.success) {
      Alert.alert('Password Sent', result.message, [{ text: 'OK' }]);
    } else {
      Alert.alert('Forgot Password', result.message, [{ text: 'OK' }]);
    }
  };

  const header = (
    <View style={styles.logoContainer}>
      <Image
        source={getBrandLogo(getCurrentBrandId())}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="h2" center style={styles.title}>
        {currentBrand.brand.name}
      </Text>
      <Text variant="body" color="secondary" center style={styles.subtitle}>
        {currentBrand.brand.tagline ||
          "Stay connected with your child's education"}
      </Text>
    </View>
  );

  return (
    <AuthTemplate header={header}>
      <View style={styles.formContainer}>
        <Text variant="h3" style={styles.formTitle}>
          Login with Mobile
        </Text>
        <Text variant="body" color="secondary" style={styles.formSubtitle}>
          Enter your registered mobile number to continue
        </Text>

        <Input
          label="Mobile Number"
          placeholder="Enter 10-digit mobile number"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
          maxLength={10}
          error={error || undefined}
          containerStyle={styles.input}
          leftIcon={
            <Text variant="body" color="secondary">
              +91
            </Text>
          }
        />

        <Button
          title="Continue"
          onPress={handleGetOtp}
          loading={isLoading}
          disabled={!isValidMobile || isLoading}
          fullWidth
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => {
            setForgotMobile(mobileNumber);
            setShowForgotModal(true);
          }}
          style={styles.forgotPassword}
        >
          <Text variant="body" color="primary" center>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Text variant="caption" color="muted" center style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text variant="h3" style={styles.modalTitle}>
              Forgot Password
            </Text>
            <Text variant="body" color="secondary" style={styles.modalSubtitle}>
              Enter your registered mobile number. Your password will be sent to your registered email.
            </Text>

            <View style={styles.modalInputContainer}>
              <Text variant="body" color="secondary" style={styles.modalPrefix}>
                +91
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={colors.textMuted}
                value={forgotMobile}
                onChangeText={setForgotMobile}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowForgotModal(false)}
                style={styles.modalCancelButton}
              >
                <Text variant="body" color="secondary">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={!isValidForgotMobile || isForgotLoading}
                style={[
                  styles.modalSendButton,
                  (!isValidForgotMobile || isForgotLoading) && styles.modalSendButtonDisabled,
                ]}
              >
                <Text variant="body" style={{ color: '#fff' }}>
                  {isForgotLoading ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AuthTemplate>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    marginTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  formContainer: {
    marginTop: spacing['2xl'],
  },
  formTitle: {
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    marginBottom: spacing['2xl'],
  },
  input: {
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.lg,
  },
  forgotPassword: {
    marginTop: spacing.lg,
    padding: spacing.xs,
  },
  terms: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.base,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    marginBottom: spacing.lg,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.base,
    height: 48,
    marginBottom: spacing.lg,
  },
  modalPrefix: {
    marginRight: spacing.sm,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  modalSendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSendButtonDisabled: {
    opacity: 0.5,
  },
});
