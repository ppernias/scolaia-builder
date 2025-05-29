// Editor module - Main entry point
// This file acts as a bridge between the modular ES6 code and the global window object

// Import the editor module
import editor from './editor/index.js';

// Export to window object for backward compatibility
window.editor = editor;

// Export individual modules for direct access if needed
export default editor;
