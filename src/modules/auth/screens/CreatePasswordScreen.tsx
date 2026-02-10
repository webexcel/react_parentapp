import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
    AuthTemplate,
    Text,
    Input,
    Button,
    colors,
    spacing,
} from '../../../design-system';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/auth/authService';

export const CreatePasswordScreen: React.FC = () => {
    const { userData, completePasswordSetup } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isValidPassword = /^\d{5}$/.test(password);
    const passwordsMatch = password === confirmPassword;

    const handleCreatePassword = async () => {
        setError(null);

        if (!isValidPassword) {
            Alert.alert('Invalid Password', 'Password must be exactly 5 digits.');
            return;
        }

        if (!passwordsMatch) {
            Alert.alert('Mismatch', 'Passwords do not match. Please try again.');
            return;
        }

        try {
            setIsLoading(true);
            const mobileNumber = userData?.mobileNumber || userData?.mobile_number || '';

            if (!mobileNumber) {
                Alert.alert('Error', 'Mobile number not found. Please login again.');
                return;
            }

            const result = await authService.createPassword(password, mobileNumber);

            if (result.status) {
                Alert.alert(
                    'Password Created',
                    'Your password has been set successfully. You can use this password for future logins.',
                    [{ text: 'OK', onPress: () => completePasswordSetup() }]
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

    const header = (
        <View style={styles.headerContainer}>
            <Text variant="h2" center>
                Create Password
            </Text>
            <Text variant="body" color="secondary" center style={styles.subtitle}>
                Set a 5-digit numeric password for your account
            </Text>
        </View>
    );

    return (
        <AuthTemplate header={header}>
            <View style={styles.formContainer}>
                <View style={styles.infoContainer}>
                    <Text variant="caption" color="muted" style={styles.infoText}>
                        This password will be used for all future logins. Please remember it.
                    </Text>
                </View>

                <Input
                    label="New Password"
                    placeholder="Enter 5-digit password"
                    value={password}
                    onChangeText={(text) => {
                        // Only allow digits
                        const digits = text.replace(/[^0-9]/g, '');
                        setPassword(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                    secureTextEntry
                    error={password.length > 0 && !isValidPassword ? 'Must be exactly 5 digits' : undefined}
                    containerStyle={styles.input}
                />

                <Input
                    label="Confirm Password"
                    placeholder="Re-enter 5-digit password"
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
                    title="Create Password"
                    onPress={handleCreatePassword}
                    loading={isLoading}
                    disabled={!isValidPassword || !passwordsMatch || isLoading}
                    fullWidth
                    style={styles.button}
                />
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
    formContainer: {
        marginTop: spacing.xl,
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
