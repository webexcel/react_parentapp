import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
    AuthTemplate,
    Text,
    Input,
    Button,
    colors,
    spacing,
} from '../../../design-system';
import { usePasswordLogin } from '../hooks/usePasswordLogin';

type RootStackParamList = {
    Password: { mobileNumber: string; installId?: string };
};

type PasswordScreenRouteProp = RouteProp<RootStackParamList, 'Password'>;

export const PasswordScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<PasswordScreenRouteProp>();
    const { mobileNumber, installId } = route.params;

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { verifyPassword, isLoading, error } = usePasswordLogin();

    const handleVerify = async () => {
        if (password.length === 0) {
            Alert.alert('Invalid Password', 'Please enter your password');
            return;
        }

        const result = await verifyPassword(mobileNumber, password, installId);
        if (!result.success) {
            Alert.alert('Login Failed', result.message || 'Invalid password');
        }
        // If success, AuthContext will update and navigation will handle the redirect
    };

    const header = (
        <View style={styles.headerContainer}>
            <Text variant="h2" center>
                Enter Password
            </Text>
            <Text variant="body" color="secondary" center style={styles.subtitle}>
                Login with your password for
            </Text>
            <Text variant="body" semibold center style={styles.mobileNumber}>
                +91 {mobileNumber}
            </Text>
        </View>
    );

    return (
        <AuthTemplate header={header}>
            <View style={styles.formContainer}>
                <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    error={error || undefined}
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
                        💡 First time users, use admission number as your password
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => Alert.alert(
                        'Forgot Password?',
                        'Please contact your school administration to reset your password.',
                        [{ text: 'OK' }]
                    )}
                    style={styles.forgotPassword}
                >
                    <Text variant="body" color="primary">
                        Forgot Password?
                    </Text>
                </TouchableOpacity>

                {error && (
                    <Text variant="caption" color="error" center style={styles.error}>
                        {error}
                    </Text>
                )}

                <Button
                    title="Log In"
                    onPress={handleVerify}
                    loading={isLoading}
                    disabled={password.length === 0 || isLoading}
                    fullWidth
                    style={styles.button}
                />

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
    input: {
        marginBottom: spacing.sm,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: spacing.base,
    },
    error: {
        marginTop: spacing.base,
    },
    button: {
        marginTop: spacing.lg,
    },
    changeNumber: {
        marginTop: spacing.lg,
        padding: spacing.sm,
    },
});
