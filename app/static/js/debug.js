// Debug module for ADLBuilder

// Create a global debug object
window.debug = {
    // Log levels
    LEVELS: {
        ERROR: 'error',
        WARN: 'warn',
        INFO: 'info',
        VERBOSE: 'verbose'
    },
    
    // Log a message with a specific level
    log: (level, message, ...args) => {
        // Default to info level if not specified
        level = level || debug.LEVELS.INFO;
        
        // Check if this level is enabled in config
        if (typeof config !== 'undefined' && 
            ((config.debug && level === debug.LEVELS.VERBOSE) || 
             (config.debugLevels && config.debugLevels[level]))) {
            
            // Use appropriate console method based on level
            switch (level) {
                case debug.LEVELS.ERROR:
                    console.error(message, ...args);
                    break;
                case debug.LEVELS.WARN:
                    console.warn(message, ...args);
                    break;
                case debug.LEVELS.INFO:
                case debug.LEVELS.VERBOSE:
                default:
                    console.log(message, ...args);
                    break;
            }
        }
    },
    
    // Convenience methods for different log levels
    error: (message, ...args) => debug.log(debug.LEVELS.ERROR, message, ...args),
    warn: (message, ...args) => debug.log(debug.LEVELS.WARN, message, ...args),
    info: (message, ...args) => debug.log(debug.LEVELS.INFO, message, ...args),
    verbose: (message, ...args) => debug.log(debug.LEVELS.VERBOSE, message, ...args)
};

// For backward compatibility
const debugLog = (message, ...args) => debug.verbose(message, ...args);

// No need for auto-reload here - handled by the anti-cache script in index.html

// Initialization message
debug.info('Debug module initialized');

// Check core dependencies
document.addEventListener('DOMContentLoaded', () => {
    // Only log critical issues or when verbose logging is enabled
    if (typeof api === 'undefined') {
        debug.error('API object not loaded - application may not function correctly');
    }
    
    if (typeof app === 'undefined') {
        debug.error('App object not loaded - application may not function correctly');
    }
    
    if (typeof i18n === 'undefined') {
        debug.warn('i18n object not loaded - translations may not work');
    }
    
    // Authentication status - only log if there's an issue
    if (typeof api !== 'undefined' && typeof api.token !== 'undefined') {
        const isAuthenticated = api.token.isValid();
        debug.verbose('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    }
    
    // Log DOM initialization only in verbose mode
    debug.verbose('DOM fully loaded');
});

// Add error handler for uncaught errors
window.addEventListener('error', (event) => {
    debug.error('Uncaught error:', event.message, 'at', event.filename, 'line', event.lineno);
});

// Add handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    debug.error('Unhandled promise rejection:', event.reason);
});
