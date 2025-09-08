import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { coolifyApi } from '@/services/coolifyApi';
import { ApiConfig } from '@/types/coolify';

export function ConfigScreen() {
  const { setConfig, config, error, clearError } = useCoolify();
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allowSaveAnyway, setAllowSaveAnyway] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<ApiConfig | null>(null);

  // Prefill with cached credentials if available
  useEffect(() => {
    if (config) {
      const cleanedBase = config.baseUrl.replace(/\/api\/v1$/, '');
      setBaseUrl(cleanedBase);
      setToken(config.token);
    }
  }, [config]);

  // Surface global error from context
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  const normalizedUrl = useMemo(() => {
    // Show the endpoint we will call for testing
    const clean = baseUrl.trim().replace(/\/+$/, '');
    if (!clean) return '';
    return `${clean}/api/v1`;
  }, [baseUrl]);

  const handleSave = async () => {
    if (!baseUrl.trim() || !token.trim()) {
      setErrorMessage('❌ Both Coolify URL and API token are required.');
      return;
    }

    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    // Always append /api/v1 to the base URL
    const fullUrl = `${cleanUrl}/api/v1`;

    setIsLoading(true);
    try {
      const tempConfig = { baseUrl: fullUrl, token: token.trim() };
      setPendingConfig(tempConfig);

      // Test connection using /api/v1/servers endpoint
      const test = await coolifyApi.testConnection(tempConfig);
      if (!test.ok) {
        let errorMessage = '';
        
        switch (test.status) {
          case 401:
          case 403:
            errorMessage = '🔐 Authentication Failed\n\nThe API token is invalid or expired.\n\n✅ How to fix:\n• Go to Coolify Dashboard → Settings → API\n• Create a new API token\n• Copy the token exactly as shown';
            break;
          case 404:
            errorMessage = '🔍 API Endpoint Not Found\n\nThe Coolify API is not accessible at this URL.\n\n✅ How to fix:\n• Verify your Coolify domain is correct\n• Ensure Coolify is running and accessible\n• Check if you need https:// or http://';
            break;
          case 500:
            errorMessage = '⚠️ Server Error\n\nCoolify server returned an internal error.\n\n✅ How to fix:\n• Check Coolify server logs\n• Try again in a few moments\n• Contact your Coolify administrator';
            break;
          default:
            if (!test.status) {
              errorMessage = '🌐 Connection Failed\n\nCannot reach the Coolify server.\n\n✅ How to fix:\n• Check your internet connection\n• Verify the URL is correct\n• Ensure Coolify is running';
            } else {
              errorMessage = `❌ Connection Error (${test.status})\n\n${test.message}\n\n✅ How to fix:\n• Check the URL and try again\n• Verify Coolify is accessible\n• Check SSL certificate if using HTTPS`;
            }
        }
        
        setErrorMessage(errorMessage);
        // If on web and likely CORS/preflight issue, allow bypass
        const looksLikeCors = Platform.OS === 'web' && (/CORS|Preflight|preflight|Failed to fetch|redirect/i.test(test.message) || !test.status);
        setAllowSaveAnyway(looksLikeCors);
        return;
      }

      await setConfig(tempConfig);
      Alert.alert('✅ Connected!', 'Successfully connected to Coolify. You can now manage your servers and applications.');
      setErrorMessage(null);
      setAllowSaveAnyway(false);
      setPendingConfig(null);
    } catch (error) {
      setErrorMessage('❌ Unexpected Error\n\nFailed to save configuration.\n\n✅ How to fix:\n• Check your internet connection\n• Try again in a few moments\n• Restart the app if the problem persists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnyway = async () => {
    if (!pendingConfig) return;
    setIsLoading(true);
    try {
      await setConfig(pendingConfig);
      Alert.alert('⚠️ Saved', 'Configuration saved without validation. Some features may not work properly if the connection is invalid.');
      setErrorMessage(null);
      setAllowSaveAnyway(false);
      setPendingConfig(null);
    } catch (e) {
      setErrorMessage('❌ Failed to save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Welcome to Coolify</Text>
          <Text style={styles.subtitle}>
            Connect to your Coolify instance to get started
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            {[
              <Text key="msg" style={styles.errorText}>{errorMessage}</Text>,
              <TouchableOpacity key="btn" onPress={() => { setErrorMessage(null); clearError(); }}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            ]}
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Coolify Host URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-coolify.domain.com"
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholderTextColor="#94A3B8"
            />
            {!!normalizedUrl && (
              <Text style={styles.helperText}>Will test connection to: {normalizedUrl}/servers</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>API Token</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Coolify API token"
              value={token}
              onChangeText={setToken}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Connecting...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>

          {allowSaveAnyway && (
            <TouchableOpacity
              style={[styles.saveAnywayButton, isLoading && styles.saveAnywayButtonDisabled]}
              onPress={handleSaveAnyway}
              disabled={isLoading}
            >
              <Text style={styles.saveAnywayButtonText}>
                Save anyway (bypass browser CORS check)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.help}>
          <Text style={styles.helpTitle}>How to get your API token:</Text>
          <Text style={styles.helpText}>
            1. Go to your Coolify dashboard{'\n'}
            2. Navigate to Settings → API{'\n'}
            3. Create a new API token{'\n'}
            4. Copy and paste it above
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
  },
  form: {
    marginBottom: 48,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  input: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.8)' : '#FFFFFF',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderWidth: 0,
    borderRadius: 16,
    padding: 18,
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  saveAnywayButton: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(248, 250, 252, 0.8)' : '#F8FAFC',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  saveAnywayButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  saveAnywayButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  help: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(238, 242, 255, 0.8)' : '#EEF2FF',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 0,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  helpText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 22,
    fontWeight: '500',
  },
});
