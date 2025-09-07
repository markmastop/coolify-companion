import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';

export function ConfigScreen() {
  const { setConfig } = useCoolify();
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!baseUrl.trim() || !token.trim()) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    const fullUrl = `${cleanUrl}/api`;

    setIsLoading(true);
    try {
      await setConfig({
        baseUrl: fullUrl,
        token: token.trim(),
      });
      Alert.alert('Success', 'Configuration saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
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