// Error handler para suprimir errores de extensiones de Chrome

(function() {
    // Interceptar errores de red antes de que lleguen a la consola
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj')) {
            // Devolver una promesa resuelta vacía para evitar errores
            return Promise.resolve(new Response('', { status: 200 }));
        }
        return originalFetch.apply(this, args);
    };
    
    // Guardar la función original console.error
    const originalConsoleError = console.error;
    
    // Sobrescribir console.error para filtrar mensajes específicos
    console.error = function(...args) {
        // Convertir todos los argumentos a string para buscar patrones
        const errorString = JSON.stringify(args);
        
        // Lista de patrones a filtrar
        const patternsToFilter = [
            'chrome-extension://',
            'pejdijmoenmkgeppbflobdenhhabjlaj',
            'utils.js',
            'extensionState.js',
            'heuristicsRedefinitions.js',
            'ERR_FILE_NOT_FOUND',
            'completion_list.html'
        ];
        
        // Verificar si el error contiene alguno de los patrones a filtrar
        if (patternsToFilter.some(pattern => errorString.includes(pattern))) {
            // No hacer nada, suprimir el error
            return;
        }
        
        // Para otros errores, usar la función original
        originalConsoleError.apply(console, args);
    };
    
    // Interceptar errores de carga de recursos
    window.addEventListener('error', function(event) {
        // Verificar si el error está relacionado con la extensión de Chrome
        if (event.target && event.target.src && 
            (event.target.src.includes('chrome-extension://') || 
             event.target.src.includes('pejdijmoenmkgeppbflobdenhhabjlaj'))) {
            // Prevenir que el error se propague
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true); // El tercer parámetro true es para capturar el evento en la fase de captura
    
    // También podemos interceptar errores de script
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name === 'src' && value && value.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj')) {
                    // No establecer el atributo src para scripts de la extensión problemática
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        return element;
    };
})();
