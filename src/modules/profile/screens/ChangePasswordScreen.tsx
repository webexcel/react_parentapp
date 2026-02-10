import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ScreenHeader,
    Text,
    Input,
    Button,
    colors,
    spacing,
    borderRadius,
    shadows,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/auth/authService';

export const ChangePasswordScreen: React.FC = () => {
    const navigation = useNavigation();
    const { userData } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValidOldPassword = oldPassword.length === 5;
    const isValidNewPassword = /^\d{5}$/.test(newPassword);
    const passwordsMatch = newPassword === confirmPassword;
    const isSamePassword = oldPassword === newPassword && oldPassword.length > 0;

    const handleChangePassword = async () => {
        setError(null);

        if (!isValidOldPassword) {
            Alert.alert('Invalid Password', 'Current password must be 5 digits.');
            return;
        }

        if (!isValidNewPassword) {
            Alert.alert('Invalid Password', 'New password must be exactly 5 digits.');
            return;
        }

        if (!passwordsMatch) {
            Alert.alert('Mismatch', 'New passwords do not match. Please try again.');
            return;
        }

        if (isSamePassword) {
            Alert.alert('Same Password', 'New password must be different from current password.');
            return;
        }

        try {
            setIsLoading(true);
            const mobileNumber = userData?.mobileNumber || userData?.mobile_number || '';

            if (!mobileNumber) {
                Alert.alert('Error', 'Mobile number not found. Please login again.');
                return;
            }

            const result = await authService.changePassword(oldPassword, newPassword, mobileNumber);

            if (result.status) {
                Alert.alert(
                    'Password Changed',
                    'Your password has been changed successfully.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                setError(result.message);
                Alert.alert('Error', result.message);
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Something went wrong. Please try again.';
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScreenHeader
                title="Change Password"
                showBack
                onBack={() => navigation.goBack()}
            />

            <View style={styles.content}>
                <View style={styles.infoContainer}>
                    <Text variant="caption" color="muted" style={styles.infoText}>
                        Enter your current password and set a new 5-digit numeric password.
                    </Text>
                </View>

                <Input
                    label="Current Password"
                    placeholder="Enter current 5-digit password"
                    value={oldPassword}
                    onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, '');
                        setOldPassword(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                    secureTextEntry
                    containerStyle={styles.input}
                />

                <Input
                    label="New Password"
                    placeholder="Enter new 5-digit password"
                    value={newPassword}
                    onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, '');
                        setNewPassword(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                    secureTextEntry
                    error={newPassword.length > 0 && !isValidNewPassword ? 'Must be exactly 5 digits' : isSamePassword ? 'Must be different from current password' : undefined}
                    containerStyle={styles.input}
                />

                <Input
                    label="Confirm New Password"
                    placeholder="Re-enter new 5-digit password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                        const digits = text.replace(/[^0-9]/g, '');
                        setConfirmPassword(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                    secureTextEntry
                    error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
                    containerStyle={styles.input}
                />

                {error && (
                    <Text variant="caption" color="error" center style={styles.error}>
                        {error}
                    </Text>
                )}

                <Button
                    title="Change Password"
                    onPress={handleChangePassword}
                    loading={isLoading}
                    disabled={!isValidOldPassword || !isValidNewPassword || !passwordsMatch || isSamePassword || isLoading}
                    fullWidth
                    style={styles.button}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    content: {
        padding: spacing.base,
        paddingTop: spacing.xl,
    },
    infoContainer: {
        backgroundColor: colors.primarySoft,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        borderRadius: 8,
        marginBottom: spacing.lg,
    },
    infoText: {
        textAlign: 'center',
    },
    input: {
        marginBottom: spacing.base,
    },
    error: {
        marginTop: spacing.sm,
    },
    button: {
        marginTop: spacing.lg,
    },
});
