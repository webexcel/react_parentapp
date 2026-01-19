import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
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
import { currentBrand } from '../../../core/brand/BrandConfig';

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
  const authType = currentBrand.auth.type;

  const isValidMobile = mobileNumber.length === 10 && /^[6-9]\d{9}$/.test(mobileNumber);

  const handleGetOtp = async () => {
    if (!isValidMobile) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
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

  const header = (
    <View style={styles.logoContainer}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="h2" style={styles.title}>
        {currentBrand.brand.shortName}
      </Text>
      <Text variant="body" color="secondary" center style={styles.subtitle}>
        {currentBrand.brand.tagline || "Stay connected with your child's education"}
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
          onPress={() => Alert.alert(
            'Forgot Password?',
            'Please contact your school administration to reset your password.',
            [{ text: 'OK' }]
          )}
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
});
