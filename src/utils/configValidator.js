// Configuration validation utility
import config from '../config/environment';

/**
 * Validates the current configuration and returns detailed results
 */
export const validateConfiguration = () => {
  const results = {
    isValid: true,
    errors: [],
    warnings: [],
    info: []
  };

  // Check required Firebase configuration (when not in mock mode)
  if (!config.mock.enabled) {
    const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId'];
    requiredFirebaseFields.forEach(field => {
      if (!config.firebase[field]) {
        results.errors.push(`Missing required Firebase configuration: ${field}`);
        results.isValid = false;
      }
    });
  }

  // Check mock configuration
  if (config.mock.enabled) {
    if (config.mock.delayMs < 0) {
      results.errors.push('Mock delay cannot be negative');
      results.isValid = false;
    }
    if (config.mock.delayMs > 5000) {
      results.warnings.push('Mock delay is very high (>5s), this may affect user experience');
    }
  }

  // Check UI configuration
  if (config.ui.maxNotesPerUser <= 0) {
    results.errors.push('Maximum notes per user must be positive');
    results.isValid = false;
  }
  if (config.ui.maxNotesPerUser > 1000) {
    results.warnings.push('Maximum notes per user is very high (>1000), this may affect performance');
  }

  if (config.ui.noteColors.length === 0) {
    results.errors.push('At least one note color must be specified');
    results.isValid = false;
  }

  // Check demo spaces
  if (config.demoSpaces.length === 0) {
    results.warnings.push('No demo spaces configured');
  }

  // Add configuration info
  results.info.push(`App Name: ${config.app.name}`);
  results.info.push(`Version: ${config.app.version}`);
  results.info.push(`Environment: ${process.env.NODE_ENV}`);
  results.info.push(`Mock Mode: ${config.mock.enabled ? 'Enabled' : 'Disabled'}`);
  results.info.push(`Debug Mode: ${config.development.debugMode ? 'Enabled' : 'Disabled'}`);

  return results;
};

/**
 * Logs configuration validation results
 */
export const logConfigurationValidation = () => {
  const results = validateConfiguration();
  
  console.group('🔧 Configuration Validation');
  
  if (results.isValid) {
    console.log('✅ Configuration is valid');
  } else {
    console.error('❌ Configuration validation failed');
  }

  if (results.errors.length > 0) {
    console.group('❌ Errors:');
    results.errors.forEach(error => console.error(error));
    console.groupEnd();
  }

  if (results.warnings.length > 0) {
    console.group('⚠️ Warnings:');
    results.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }

  if (results.info.length > 0) {
    console.group('ℹ️ Info:');
    results.info.forEach(info => console.log(info));
    console.groupEnd();
  }

  console.groupEnd();
  
  return results;
};

/**
 * Exports configuration for external use
 */
export const exportConfiguration = () => {
  return {
    app: config.app,
    mock: config.mock,
    demoSpaces: config.demoSpaces,
    ui: config.ui,
    development: config.development,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };
};
