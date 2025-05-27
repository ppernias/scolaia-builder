// Script para bloquear completamente los errores de la extensiu00f3n Chrome

(function() {
    // Lista de recursos a bloquear
    const blockedResources = [
        'chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/utils.js',
        'chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/extensionState.js',
        'chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj/heuristicsRedefinitions.js'
    ];
    
    // Crear un Service Worker virtual para interceptar las solicitudes
    if ('serviceWorker' in navigator) {
        // Registrar un controlador para mensajes de error
        window.addEventListener('error', function(event) {
            // Verificar si el error estu00e1 relacionado con la extensiu00f3n de Chrome
            if (event.filename && blockedResources.some(resource => event.filename.includes(resource))) {
                // Prevenir que el error se propague
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }, true);
        
        // Interceptar console.error
        const originalConsoleError = console.error;
        console.error = function(...args) {
            // Convertir argumentos a string para buscar patrones
            const errorString = args.join(' ');
            
            // Verificar si el error estu00e1 relacionado con la extensiu00f3n de Chrome
            if (errorString.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj') ||
                errorString.includes('ERR_FILE_NOT_FOUND') ||
                errorString.includes('completion_list.html')) {
                // Suprimir el error
                return;
            }
            
            // Para otros errores, usar la funciu00f3n original
            originalConsoleError.apply(console, args);
        };
    }
    
    // Interceptar solicitudes de red
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && url.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj')) {
            // Devolver una promesa resuelta vacu00eda
            return Promise.resolve(new Response('', { status: 200 }));
        }
        return originalFetch.apply(this, [url, options]);
    };
    
    // Interceptar XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && url.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj')) {
            // Redirigir a un recurso vacu00edo
            url = 'data:text/plain,empty';
        }
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };
    
    // Interceptar createElement para scripts
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name === 'src' && typeof value === 'string' && 
                    value.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj')) {
                    // No establecer el atributo
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        return element;
    };
    
    // Mensaje de depuraciu00f3n (comentar en producciu00f3n)
    console.log('Extension blocker initialized');
})();
