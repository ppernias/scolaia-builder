// Editor state management
export const state = {
    mode: 'simple', // 'simple' or 'advanced'
    currentAssistant: null,
    yamlContent: '',
    isModified: false,
    schema: null,
    formData: {} // Data from the form
};

// State update functions
export const updateState = {
    setMode: (mode) => {
        state.mode = mode;
    },
    setCurrentAssistant: (assistant) => {
        state.currentAssistant = assistant;
    },
    setYamlContent: (content) => {
        state.yamlContent = content;
    },
    setModified: (isModified) => {
        state.isModified = isModified;
    },
    setSchema: (schema) => {
        state.schema = schema;
    },
    setFormData: (data) => {
        state.formData = data;
    }
};
