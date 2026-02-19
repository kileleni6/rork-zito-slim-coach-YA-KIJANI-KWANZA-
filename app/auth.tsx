import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Zap, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthScreen() {
  const { colors } = useTheme();
  const { signIn, signUp, resetPassword, isSigningIn, isSigningUp, isResettingPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isPending = isSigningIn || isSigningUp || isResettingPassword;

  const switchMode = useCallback((newMode: AuthMode) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setMode(newMode);
      setError('');
      setPassword('');
      setConfirmPassword('');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const validate = useCallback((): boolean => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (mode === 'forgot') return true;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  }, [email, password, confirmPassword, mode]);

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!validate()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else if (mode === 'signup') {
        await signUp(email.trim(), password);
      } else {
        await resetPassword(email.trim());
        Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
        switchMode('login');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [mode, email, password, validate, signIn, signUp, resetPassword, switchMode]);

  const title = mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password';
  const subtitle = mode === 'login'
    ? 'Sign in to continue your journey'
    : mode === 'signup'
    ? 'Start your fat-loss transformation'
    : 'We\'ll send you a reset link';
  const buttonText = mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerSection}>
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                style={styles.logoBg}
              >
                <Zap color="#fff" size={36} />
              </LinearGradient>
              <Text style={[styles.appName, { color: colors.accent }]}>ZITO</Text>
            </View>

            <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

              {error ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.danger + '12', borderColor: colors.danger + '30' }]}>
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Zap color={colors.textTertiary} size={18} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Email address"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={mode === 'forgot' ? 'done' : 'next'}
                    onSubmitEditing={() => mode !== 'forgot' && passwordRef.current?.focus()}
                    testID="auth-email"
                  />
                </View>

                {mode !== 'forgot' && (
                  <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Zap color={colors.textTertiary} size={18} />
                    <TextInput
                      ref={passwordRef}
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Password"
                      placeholderTextColor={colors.textTertiary}
                      value={password}
                      onChangeText={(t) => { setPassword(t); setError(''); }}
                      secureTextEntry={!showPassword}
                      returnKeyType={mode === 'signup' ? 'next' : 'done'}
                      onSubmitEditing={() => mode === 'signup' ? confirmRef.current?.focus() : handleSubmit()}
                      testID="auth-password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={{ color: colors.textTertiary, fontSize: 13, fontWeight: '600' as const }}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {mode === 'signup' && (
                  <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Zap color={colors.textTertiary} size={18} />
                    <TextInput
                      ref={confirmRef}
                      style={[styles.input, { color: colors.textPrimary }]}
                      placeholder="Confirm password"
                      placeholderTextColor={colors.textTertiary}
                      value={confirmPassword}
                      onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      testID="auth-confirm-password"
                    />
                  </View>
                )}
              </View>

              {mode === 'login' && (
                <TouchableOpacity onPress={() => switchMode('forgot')} style={styles.forgotBtn}>
                  <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={isPending}
                style={styles.submitBtnWrap}
                testID="auth-submit"
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentDark]}
                  style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>{buttonText}</Text>
                      <ArrowRight color="#fff" size={18} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.switchRow}>
                {mode === 'login' ? (
                  <>
                    <Text style={[styles.switchText, { color: colors.textSecondary }]}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => switchMode('signup')}>
                      <Text style={[styles.switchLink, { color: colors.accent }]}>Sign Up</Text>
                    </TouchableOpacity>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <Text style={[styles.switchText, { color: colors.textSecondary }]}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => switchMode('login')}>
                      <Text style={[styles.switchLink, { color: colors.accent }]}>Sign In</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={[styles.switchText, { color: colors.textSecondary }]}>Remember your password?</Text>
                    <TouchableOpacity onPress={() => switchMode('login')}>
                      <Text style={[styles.switchLink, { color: colors.accent }]}>Sign In</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Animated.View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBg: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900' as const,
    letterSpacing: 4,
  },
  formSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 24,
  },
  errorBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 12,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  submitBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  bottomSpacer: {
    height: 40,
  },
});
