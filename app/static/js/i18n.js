// Internationalization module for ADLBuilder

const i18n = {
    // Current language
    currentLang: 'en',
    
    // Available languages
    languages: {
        en: 'English',
        es: 'Español'
    },
    
    // Translations
    translations: {
        en: {
            // Common
            'app.name': 'ADLBuilder',
            'app.tagline': 'Build Powerful AI Assistants',
            'app.description': 'Create, customize, and share assistant definitions with a schema-driven editor',
            
            // Navigation
            'nav.home': 'Home',
            'nav.editor': 'Editor',
            'nav.templates': 'Templates',
            'nav.myAssistants': 'My Assistants',
            'nav.admin': 'Admin',
            
            // Auth
            'auth.login': 'Login',
            'auth.register': 'Register',
            'auth.logout': 'Logout',
            'auth.myProfile': 'My Profile',
            'auth.adminPanel': 'Admin Panel',
            'auth.loginSuccess': 'Login successful!',
            'auth.incorrectCredentials': 'Incorrect credentials. Please verify your email and password.',
            'auth.loginError': 'Could not log in. Please try again later.',
            'auth.loginRequired': 'You need to login to access this feature.',
            
            // Home page
            'home.getStarted': 'Get Started',
            'home.exploreTemplates': 'Explore Templates',
            'home.features.editing.title': 'Dual Editing Modes',
            'home.features.editing.description': 'Simple mode for quick customization or advanced mode for full control',
            'home.features.validation.title': 'Validation',
            'home.features.validation.description': 'Real-time validation against the schema ensures your assistants are always valid',
            'home.features.save.title': 'Save & Share',
            'home.features.save.description': 'Store your assistants in your personal workspace and optionally share them',
            
            // Assistants
            'assistants.title': 'My Assistants',
            'assistants.loading': 'Loading assistants...',
            'assistants.empty.title': 'You don\'t have any assistants yet',
            'assistants.empty.description': 'Create your first custom assistant to start using ADLBuilder.',
            'assistants.empty.button': 'Create my first assistant',
            'assistants.create': 'Create New',
            'assistants.search.placeholder': 'Search assistants...',
            'assistants.sort.newest': 'Newest First',
            'assistants.sort.oldest': 'Oldest First',
            'assistants.sort.nameAsc': 'Name (A-Z)',
            'assistants.sort.nameDesc': 'Name (Z-A)',
            
            // Profile
            'profile.title': 'My Profile',
            'profile.email': 'Email',
            'profile.name': 'Full Name',
            'profile.role': 'Role',
            'profile.organization': 'Organization',
            'profile.save': 'Save Changes',
            'profile.changePassword': 'Change Password',
            
            // Admin
            'admin.title': 'Admin Panel',
            'admin.users': 'Users',
            'admin.assistants': 'Assistants'
        },
        es: {
            // Common
            'app.name': 'ADLBuilder',
            'app.tagline': 'Crea Asistentes IA Potentes',
            'app.description': 'Crea, personaliza y comparte definiciones de asistentes con un editor basado en esquemas',
            
            // Navigation
            'nav.home': 'Inicio',
            'nav.editor': 'Editor',
            'nav.templates': 'Plantillas',
            'nav.myAssistants': 'Mis Asistentes',
            'nav.admin': 'Administración',
            
            // Auth
            'auth.login': 'Iniciar Sesión',
            'auth.register': 'Registrarse',
            'auth.logout': 'Cerrar Sesión',
            'auth.myProfile': 'Mi Perfil',
            'auth.adminPanel': 'Panel de Administración',
            'auth.loginSuccess': '¡Inicio de sesión exitoso!',
            'auth.incorrectCredentials': 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.',
            'auth.loginError': 'No se pudo iniciar sesión. Por favor, inténtalo de nuevo más tarde.',
            'auth.loginRequired': 'Necesitas iniciar sesión para acceder a esta función.',
            
            // Home page
            'home.getStarted': 'Comenzar',
            'home.exploreTemplates': 'Explorar Plantillas',
            'home.features.editing.title': 'Modos de Edición Duales',
            'home.features.editing.description': 'Modo simple para personalización rápida o modo avanzado para control total',
            'home.features.validation.title': 'Validación',
            'home.features.validation.description': 'Validación en tiempo real contra el esquema asegura que tus asistentes sean siempre válidos',
            'home.features.save.title': 'Guardar y Compartir',
            'home.features.save.description': 'Almacena tus asistentes en tu espacio de trabajo personal y opcionalmente compártelos',
            
            // Assistants
            'assistants.title': 'Mis Asistentes',
            'assistants.loading': 'Cargando asistentes...',
            'assistants.empty.title': 'Aún no tienes asistentes',
            'assistants.empty.description': 'Crea tu primer asistente personalizado para comenzar a utilizar ADLBuilder.',
            'assistants.empty.button': 'Crear mi primer asistente',
            'assistants.create': 'Crear Nuevo',
            'assistants.search.placeholder': 'Buscar asistentes...',
            'assistants.sort.newest': 'Más recientes primero',
            'assistants.sort.oldest': 'Más antiguos primero',
            'assistants.sort.nameAsc': 'Nombre (A-Z)',
            'assistants.sort.nameDesc': 'Nombre (Z-A)',
            
            // Profile
            'profile.title': 'Mi Perfil',
            'profile.email': 'Email',
            'profile.name': 'Nombre Completo',
            'profile.role': 'Rol',
            'profile.organization': 'Organización',
            'profile.save': 'Guardar Cambios',
            'profile.changePassword': 'Cambiar Contraseña',
            
            // Admin
            'admin.title': 'Panel de Administración',
            'admin.users': 'Usuarios',
            'admin.assistants': 'Asistentes'
        }
    },
    
    // Initialize i18n
    init: () => {
        // Set default language
        i18n.currentLang = localStorage.getItem('language') || 'en';
        
        // Update language selector
        const langSelector = document.getElementById('language-selector');
        if (langSelector) {
            langSelector.value = i18n.currentLang;
            langSelector.addEventListener('change', (e) => {
                i18n.setLanguage(e.target.value);
            });
        }
        
        // Apply translations
        i18n.applyTranslations();
    },
    
    // Set language
    setLanguage: (lang) => {
        if (i18n.translations[lang]) {
            console.log('Changing language to:', lang);
            i18n.currentLang = lang;
            localStorage.setItem('language', lang);
            
            // Update language selector value
            const langSelector = document.getElementById('language-selector');
            if (langSelector) {
                langSelector.value = lang;
            }
            
            // Apply translations
            i18n.applyTranslations();
            
            // Dispatch a custom event for components that need to know about language changes
            window.dispatchEvent(new CustomEvent('i18n:languageChanged', { detail: { language: lang } }));
        }
    },
    
    // Get translation
    t: (key, params = {}) => {
        const translations = i18n.translations[i18n.currentLang] || i18n.translations.en;
        let text = translations[key] || key;
        
        // Replace parameters
        Object.keys(params).forEach(param => {
            text = text.replace(`{{${param}}}`, params[param]);
        });
        
        return text;
    },
    
    // Apply translations to the DOM
    applyTranslations: () => {
        console.log('Applying translations for language:', i18n.currentLang);
        
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                el.textContent = i18n.t(key);
            }
        });
        
        // Update elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.placeholder = i18n.t(key);
            }
        });
        
        // Update elements with data-i18n-title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.title = i18n.t(key);
            }
        });
        
        // Update elements with data-i18n-value attribute
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
            const key = el.getAttribute('data-i18n-value');
            if (key) {
                el.value = i18n.t(key);
            }
        });
        
        // Special handling for dynamically created content
        // This ensures that content created by JavaScript is also translated
        if (window.assistants && assistants.renderAssistants) {
            // Re-render assistants if they exist
            if (document.querySelector('.assistants-list')) {
                assistants.renderAssistants();
            }
        }
    }
};
