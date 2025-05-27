// Debug script for editor functionality

// Override console methods to show messages in the UI
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Create a debug container
function createDebugContainer() {
    const container = document.createElement('div');
    container.id = 'debug-container';
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.right = '0';
    container.style.width = '400px';
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.color = 'white';
    container.style.padding = '10px';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.zIndex = '9999';
    
    // Add a clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.position = 'absolute';
    clearButton.style.top = '5px';
    clearButton.style.right = '5px';
    clearButton.addEventListener('click', () => {
        const logContainer = document.getElementById('debug-log-container');
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    });
    container.appendChild(clearButton);
    
    // Add a toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide';
    toggleButton.style.position = 'absolute';
    toggleButton.style.top = '5px';
    toggleButton.style.right = '60px';
    toggleButton.addEventListener('click', () => {
        const logContainer = document.getElementById('debug-log-container');
        if (logContainer) {
            if (logContainer.style.display === 'none') {
                logContainer.style.display = 'block';
                toggleButton.textContent = 'Hide';
            } else {
                logContainer.style.display = 'none';
                toggleButton.textContent = 'Show';
            }
        }
    });
    container.appendChild(toggleButton);
    
    // Add a title
    const title = document.createElement('h3');
    title.textContent = 'Debug Console';
    title.style.margin = '0 0 10px 0';
    title.style.paddingBottom = '5px';
    title.style.borderBottom = '1px solid #555';
    container.appendChild(title);
    
    // Add a log container
    const logContainer = document.createElement('div');
    logContainer.id = 'debug-log-container';
    container.appendChild(logContainer);
    
    return container;
}

// Add a log entry
function addLogEntry(type, ...args) {
    const logContainer = document.getElementById('debug-log-container');
    if (!logContainer) return;
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '5px';
    entry.style.borderLeft = '3px solid ' + (type === 'error' ? 'red' : type === 'warn' ? 'orange' : 'green');
    entry.style.paddingLeft = '5px';
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = document.createElement('span');
    prefix.textContent = `[${timestamp}] [${type.toUpperCase()}] `;
    prefix.style.color = type === 'error' ? 'red' : type === 'warn' ? 'orange' : 'lightgreen';
    entry.appendChild(prefix);
    
    const content = document.createElement('span');
    content.textContent = args.map(arg => {
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg);
            } catch (e) {
                return String(arg);
            }
        }
        return String(arg);
    }).join(' ');
    entry.appendChild(content);
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Override console methods
console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    addLogEntry('log', ...args);
};

console.error = function(...args) {
    originalConsoleError.apply(console, args);
    addLogEntry('error', ...args);
};

console.warn = function(...args) {
    originalConsoleWarn.apply(console, args);
    addLogEntry('warn', ...args);
};

// Add debug hooks for editor functions
let hookAttempts = 0;
function addEditorDebugHooks() {
    // Limit the number of attempts to avoid endless error messages
    if (hookAttempts > 5) {
        console.warn('Giving up on adding editor debug hooks after multiple attempts');
        return;
    }
    
    hookAttempts++;
    
    if (!window.editor) {
        console.error('Editor object not found');
        // Try again in a moment, but only a limited number of times
        setTimeout(addEditorDebugHooks, 500);
        return;
    }
    
    // Hook important editor functions
    const functionsToHook = [
        'createNew',
        'loadEditorTemplate',
        'updateEditorMode',
        'prepareEditor',
        'initContent',
        'loadSchema',
        'generateForm',
        'updateYamlPreview',
        'saveAssistant'
    ];
    
    functionsToHook.forEach(funcName => {
        const originalFunc = editor[funcName];
        if (typeof originalFunc === 'function') {
            editor[funcName] = function(...args) {
                console.log(`Calling editor.${funcName}() with args:`, args);
                try {
                    const result = originalFunc.apply(this, args);
                    if (result instanceof Promise) {
                        return result.then(res => {
                            console.log(`editor.${funcName}() completed successfully with result:`, res);
                            return res;
                        }).catch(err => {
                            console.error(`editor.${funcName}() failed with error:`, err);
                            throw err;
                        });
                    } else {
                        console.log(`editor.${funcName}() completed successfully`);
                        return result;
                    }
                } catch (err) {
                    console.error(`editor.${funcName}() failed with error:`, err);
                    throw err;
                }
            };
        }
    });
    
    // Add a special hook for the click event on create-new-assistant button
    const createButton = document.getElementById('create-new-assistant');
    if (createButton) {
        createButton.addEventListener('click', function() {
            console.log('Create new assistant button clicked');
        }, true);
    }
    
    console.log('Editor debug hooks added');
}

// Initialize debugging
function initDebug() {
    // Create and append debug container
    const debugContainer = createDebugContainer();
    document.body.appendChild(debugContainer);
    
    // Add editor debug hooks when the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addEditorDebugHooks);
    } else {
        addEditorDebugHooks();
    }
    
    // Also hook into navigation events
    const originalNavigateTo = app.navigateTo;
    app.navigateTo = function(page) {
        console.log(`Navigating to page: ${page}`);
        const result = originalNavigateTo.apply(this, arguments);
        
        // If navigating to editor, add hooks after a short delay
        if (page === 'editor') {
            setTimeout(addEditorDebugHooks, 500);
        }
        
        return result;
    };
    
    console.log('Debug initialization complete');
}

// Initialize debugging when the page loads
window.addEventListener('load', initDebug);

// Also expose a global function to manually initialize debugging
window.initDebug = initDebug;
