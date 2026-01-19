import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  AuthTemplate,
  Text,
  Button,
  OtpInput,
  colors,
  spacing,
} from '../../../design-system';
import { useOtpVerification } from '../hooks/useOtpVerification';
import { useLogin } from '../hooks/useLogin';

type RootStackParamList = {
  OTP: { mobileNumber: string; installId?: string };
};

type OtpScreenRouteProp = RouteProp<RootStackParamList, 'OTP'>;

export const OtpScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<OtpScreenRouteProp>();
  const { mobileNumber, installId } = route.params;

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const { verifyOtp, isLoading, error } = useOtpVerification();
  const { sendOtp, isLoading: isResending } = useLogin();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP');
      return;
    }

    const result = await verifyOtp(mobileNumber, otp, installId);
    if (!result.success) {
      Alert.alert('Verification Failed', result.message || 'Invalid OTP');
    }
    // If success, AuthContext will update and navigation will handle the redirect
  };

  const handleResend = async () => {
    if (!canResend) return;

    const result = await sendOtp(mobileNumber);
    if (result.success) {
      setOtp('');
      setCountdown(30);
      setCanResend(false);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number');
    } else {
      Alert.alert('Error', result.message || 'Failed to resend OTP');
    }
  };

  const header = (
    <View style={styles.headerContainer}>
      <Text variant="h2" center>
        Verify OTP
      </Text>
      <Text variant="body" color="secondary" center style={styles.subtitle}>
        Enter the 4-digit code sent to
      </Text>
      <Text variant="body" semibold center style={styles.mobileNumber}>
        +91 {mobileNumber}
      </Text>
    </View>
  );

  return (
    <AuthTemplate header={header}>
      <View style={styles.formContainer}>
        <OtpInput
          value={otp}
          onChange={setOtp}
          length={4}
          error={!!error}
          autoFocus
        />

        {error && (
          <Text variant="caption" color="error" center style={styles.error}>
            {error}
          </Text>
        )}

        <Button
          title="Verify OTP"
          onPress={handleVerify}
          loading={isLoading}
          disabled={otp.length !== 4 || isLoading}
          fullWidth
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text variant="body" color="primary" center>
                {isResending ? 'Sending...' : "Didn't receive OTP? Resend"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text variant="body" color="secondary" center>
              Resend OTP in {countdown}s
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.changeNumber}
        >
          <Text variant="body" color="primary" center>
            Change Mobile Number
          </Text>
        </TouchableOpacity>
      </View>
    </AuthTemplate>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  mobileNumber: {
    marginTop: spacing.xs,
    color: colors.primary,
  },
  formContainer: {
    marginTop: spacing.xl,
  },
  error: {
    marginTop: spacing.base,
  },
  button: {
    marginTop: spacing['2xl'],
  },
  resendContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  changeNumber: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
});
