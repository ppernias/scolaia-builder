// Script para identificar la extensiu00f3n problemau00e1tica

(function() {
    console.log('Iniciando identificaciu00f3n de extensiu00f3n...');
    
    // ID de la extensiu00f3n que estamos buscando
    const targetExtensionId = 'pejdijmoenmkgeppbflobdenhhabjlaj';
    
    // Funciou00f3n para mostrar informaciu00f3n sobre la extensiu00f3n
    function showExtensionInfo() {
        console.log('\n\n=== INFORMACIU00d3N DE LA EXTENSIU00d3N ===');
        console.log(`ID de la extensiu00f3n: ${targetExtensionId}`);
        console.log('\nEsta extensiu00f3n estu00e1 intentando cargar los siguientes archivos:');
        console.log('- utils.js');
        console.log('- extensionState.js');
        console.log('- heuristicsRedefinitions.js');
        
        console.log('\nBasado en estos archivos, es muy probable que sea una extensiu00f3n de:');
        console.log('- Autocompletado de cu00f3digo o sugerencias');
        console.log('- Asistente de programaciu00f3n');
        console.log('- Posiblemente una extensiu00f3n de IA para codificaciu00f3n');
        
        console.log('\nExtensiones comunes que podrían coincidir:');
        console.log('1. GitHub Copilot o alguna variante');
        console.log('2. Tabnine');
        console.log('3. Kite');
        console.log('4. CodeWhisperer');
        console.log('5. Alguna extensiu00f3n de asistencia de cu00f3digo personalizada');
        
        console.log('\nPara identificar exactamente la extensiu00f3n:');
        console.log('1. Abre una nueva pestau00f1a en Chrome');
        console.log('2. Escribe: chrome://extensions/ en la barra de direcciones');
        console.log('3. Busca extensiones relacionadas con asistentes de cu00f3digo o IA');
        console.log('4. Haz clic en "Detalles" en cada una');
        console.log('5. Compara el ID que aparece en la URL con: ' + targetExtensionId);
        console.log('   (El ID apareceru00e1 en la URL como: chrome://extensions/?id=XXXX)');
        
        console.log('\nUna vez identificada, puedes:');
        console.log('- Desactivarla temporalmente mientras trabajas en este proyecto');
        console.log('- Actualizarla si estu00e1 desactualizada');
        console.log('- Reinstalarla si estu00e1 dau00f1ada');
        console.log('=== FIN DE LA INFORMACIU00d3N ===\n\n');
    }
    
    // Mostrar la informaciu00f3n
    showExtensionInfo();
    
    // Intentar obtener mu00e1s informaciu00f3n si es posible
    try {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(targetExtensionId, { action: 'getInfo' }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('No se pudo comunicar directamente con la extensiu00f3n.');
                } else if (response) {
                    console.log('Respuesta de la extensiu00f3n:', response);
                }
            });
        }
    } catch (e) {
        console.log('No se pudo acceder a la API de Chrome Extensions desde este contexto.');
    }
})();
