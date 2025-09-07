import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { coolifyApi } from '@/services/coolifyApi';
import { ApiConfig } from '@/types/coolify';

export function ConfigScreen() {
  const { setConfig } = useCoolify();
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allowSaveAnyway, setAllowSaveAnyway] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<ApiConfig | null>(null);

  const normalizedUrl = useMemo(() => {
    // Show the endpoint we will call for testing
    const clean = baseUrl.trim().replace(/\/+$/, '');
    if (!clean) return '';
    return `${clean}/api/v1/servers`;
  }, [baseUrl]);

  const handleSave = async () => {
    if (!baseUrl.trim() || !token.trim()) {
      setErrorMessage('Please fill in both fields (URL and API token).');
      return;
    }

    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    // Always append /api/v1 to the base URL
    const fullUrl = `${cleanUrl}/api/v1`;

    setIsLoading(true);
    try {
      const tempConfig = { baseUrl: fullUrl, token: token.trim() };
      setPendingConfig(tempConfig);

      // Validate URL + API token before saving
      const test = await coolifyApi.testConnection(tempConfig);
      if (!test.ok) {
        const isAuthError = test.status === 401 || test.status === 403;
        const suggestions = isAuthError
          ? 'Verify the token on Coolify (Settings → API) and try again.'
          : test.status === 404
            ? 'Ensure the URL points to your Coolify domain. Do not append extra paths; the app tests /api/v1/servers automatically.'
            : 'Check the URL, internet connectivity, SSL certificate, and CORS settings.';
        const combined = `${test.message}\n\n${suggestions}`;
        setErrorMessage(combined);
        // If on web and likely CORS/preflight issue, allow bypass
        const looksLikeCors = Platform.OS === 'web' && (/CORS|Preflight|preflight|Failed to fetch|redirect/i.test(combined) || !test.status);
        setAllowSaveAnyway(looksLikeCors);
        return;
      }

      await setConfig(tempConfig);
      Alert.alert('Connected', 'Configuration saved successfully.');
      setErrorMessage(null);
      setAllowSaveAnyway(false);
      setPendingConfig(null);
    } catch (error) {
      setErrorMessage('Unexpected error: Failed to save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnyway = async () => {
    if (!pendingConfig) return;
    setIsLoading(true);
    try {
      await setConfig(pendingConfig);
      Alert.alert('Saved', 'Configuration saved without browser validation.');
      setErrorMessage(null);
      setAllowSaveAnyway(false);
      setPendingConfig(null);
    } catch (e) {
      setErrorMessage('Failed to save configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Configure Coolify Connection</Text>
        <Text style={styles.subtitle}>
          Enter your Coolify instance details to get started
        </Text>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
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
            />
            {!!normalizedUrl && (
              <Text style={styles.helperText}>Connecting to: {normalizedUrl}</Text>
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
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveAnywayButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  saveAnywayButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveAnywayButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  help: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
