// Editor module - Main entry point
// This file acts as a bridge between the modular ES6 code and the global window object

// Import the editor module
import editor from './editor/index.js';

// Required dependencies
const REQUIRED_DEPS = [
    'formGenerator',
    'schemaLoader',
    'api',
    'app',
    'i18n',
    'jsyaml'
];

// Function to check if all dependencies are available
const checkDependencies = () => {
    const missing = REQUIRED_DEPS.filter(dep => !window[dep]);
    if (missing.length > 0) {
        return false;
    }
    return true;
};

// Wait for dependencies to be available
let dependencyCheckCount = 0;
const MAX_DEPENDENCY_CHECKS = 100; // 10 segundos máximo
const CHECK_INTERVAL = 100; // 100ms between checks

const waitForDependencies = () => {
    return new Promise((resolve, reject) => {
        const check = () => {
            dependencyCheckCount++;
            
            if (checkDependencies()) {
                debug.info('All editor dependencies loaded successfully');
                resolve();
            } else if (dependencyCheckCount >= MAX_DEPENDENCY_CHECKS) {
                const missing = REQUIRED_DEPS.filter(dep => !window[dep]);
                console.error(`Dependencies not loaded after ${MAX_DEPENDENCY_CHECKS * CHECK_INTERVAL}ms. Missing: ${missing.join(', ')}`);
                debug.verbose('Available global objects:', Object.keys(window).filter(key => typeof window[key] === 'object' && key !== 'window'));
                reject(new Error(`Dependencies not loaded after ${MAX_DEPENDENCY_CHECKS * CHECK_INTERVAL}ms. Missing: ${missing.join(', ')}`));
            } else {
                // Log progress every 10 checks
                if (dependencyCheckCount % 10 === 0) {
                    const missing = REQUIRED_DEPS.filter(dep => !window[dep]);
                    debug.verbose(`Waiting for dependencies... (${dependencyCheckCount}/${MAX_DEPENDENCY_CHECKS}). Still missing: ${missing.join(', ')}`);
                }
                setTimeout(check, CHECK_INTERVAL);
            }
        };
        
        // Start checking after a small delay to allow scripts to load
        setTimeout(check, 200);
    });
};

// Initialize editor
const initEditor = async () => {
    try {
        // Export to window object for backward compatibility
        window.editor = editor;
        
        // Wait for DOM content to be loaded
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        debug.verbose('DOM loaded, waiting for dependencies...');
        
        // Wait for dependencies
        await waitForDependencies();
        
        debug.info('Editor module loaded successfully');
        // Dispatch an event to notify that the editor is ready
        window.dispatchEvent(new Event('editor:ready'));
    } catch (error) {
        console.error('Error initializing editor:', error);
        // Show error notification to user
        if (window.app && window.app.showNotification) {
            window.app.showNotification('Error loading editor: ' + error.message, 'error');
        } else {
            // Fallback if app is not available
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Error loading editor: ' + error.message;
            document.body.appendChild(errorDiv);
        }
    }
};

// Start initialization
initEditor();

// Export individual modules for direct access if needed
export default editor;
