import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Image, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import {
  AuthTemplate,
  Text,
  Input,
  Button,
  colors,
  spacing,
} from '../../../design-system';
import { useLogin } from '../hooks/useLogin';
import { usePasswordLogin } from '../hooks/usePasswordLogin';
import { useForgotPassword } from '../hooks/useForgotPassword';
import {
  currentBrand,
  getCurrentBrandId,
} from '../../../core/brand/BrandConfig';
import { getBrandLogo } from '../../../core/brand/BrandAssets';

export const LoginScreen: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [installId, setInstallId] = useState<string | undefined>();
  const [mobileVerified, setMobileVerified] = useState(false);

  const { sendOtp, isLoading: isSendingOtp, error: otpError } = useLogin();
  const { verifyPassword, isLoading: isVerifying, error: passwordError } = usePasswordLogin();
  const { forgotPassword, isLoading: isForgotLoading } = useForgotPassword();

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');

  const isValidMobile =
    mobileNumber.length === 10 && /^[6-9]\d{9}$/.test(mobileNumber);

  const isValidForgotMobile =
    forgotMobile.length === 10 && /^[6-9]\d{9}$/.test(forgotMobile);

  const handleLogin = async () => {
    if (!isValidMobile) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (password.length === 0) {
      Alert.alert('Invalid Password', 'Please enter your password');
      return;
    }

    // If mobile not yet verified, verify first then login
    if (!mobileVerified) {
      const otpResult = await sendOtp(mobileNumber);
      if (otpResult.success) {
        setInstallId(otpResult.installId);
        setMobileVerified(true);
        // Now verify password
        const result = await verifyPassword(mobileNumber, password, otpResult.installId);
        if (!result.success) {
          Alert.alert('Login Failed', result.message || 'Invalid password');
        }
      } else {
        Alert.alert('Error', otpResult.message || 'Mobile number not found');
      }
    } else {
      // Mobile already verified, just verify password
      const result = await verifyPassword(mobileNumber, password, installId);
      if (!result.success) {
        Alert.alert('Login Failed', result.message || 'Invalid password');
      }
    }
  };

  const handleChangeNumber = () => {
    setMobileNumber('');
    setPassword('');
    setInstallId(undefined);
    setMobileVerified(false);
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
          Enter your registered mobile number and password
        </Text>

        <Input
          label="Mobile Number"
          placeholder="Enter 10-digit mobile number"
          value={mobileNumber}
          onChangeText={(text) => {
            setMobileNumber(text);
            if (mobileVerified) {
              setMobileVerified(false);
              setInstallId(undefined);
            }
          }}
          keyboardType="phone-pad"
          maxLength={10}
          error={otpError || undefined}
          containerStyle={styles.input}
          leftIcon={
            <Text variant="body" color="secondary">
              +91
            </Text>
          }
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          error={passwordError || undefined}
          containerStyle={styles.input}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text variant="caption" color="primary">
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.hintContainer}>
          <Text variant="caption" color="muted" style={styles.hintText}>
            First time users, use admission number as your password
          </Text>
        </View>

        <Button
          title="Log In"
          onPress={handleLogin}
          loading={isSendingOtp || isVerifying}
          disabled={!isValidMobile || password.length === 0 || isSendingOtp || isVerifying}
          fullWidth
          style={styles.button}
        />

        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={handleChangeNumber}
            style={styles.linkButton}
          >
            <Text variant="body" color="primary">
              Change Number
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setForgotMobile(mobileNumber);
              setShowForgotModal(true);
            }}
            style={styles.linkButton}
          >
            <Text variant="body" color="primary">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

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
    marginBottom: spacing.base,
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
    marginTop: spacing.base,
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
  hintContainer: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 8,
    marginBottom: spacing.base,
  },
  hintText: {
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  linkButton: {
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
