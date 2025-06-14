// Script para depurar los campos del formulario y su renderizado
console.log('Script de depuración de campos de formulario cargado');

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('=== DEPURACIÓN DE CAMPOS DE FORMULARIO ===');
    // Listar todos los campos con ID que comience con field-metadata-author
    const authorFields = Array.from(document.querySelectorAll('[id^="field-metadata-author"]'));
    console.log('Campos de autor disponibles:', authorFields.map(el => ({ id: el.id, value: el.value })));
    
    // Verificar específicamente el campo contact
    const contactField = document.getElementById('field-metadata-author-contact');
    if (contactField) {
      console.log('Campo contact encontrado:', { 
        id: contactField.id, 
        value: contactField.value,
        attributes: Array.from(contactField.attributes).map(attr => `${attr.name}=${attr.value}`)
      });
    } else {
      console.error('El campo contact NO fue encontrado en el DOM');
      // Buscar campos con data-path
      const alternativeField = document.querySelector('input[data-path="metadata.author.contact"]');
      if (alternativeField) {
        console.log('Campo contact encontrado por data-path:', alternativeField);
      } else {
        console.error('No se encontró ningún campo para metadata.author.contact');
      }
    }
  }, 2000);
});

// Monitorear la carga del formulario
window.addEventListener('editor:ready', () => {
  console.log('Editor listo, esperando generación del formulario...');
});

// Interceptar la función updateFieldsInForm para depuración
const originalUpdateFieldsInForm = window.updateFieldsInForm;
if (typeof originalUpdateFieldsInForm === 'function') {
  window.updateFieldsInForm = function(authorData) {
    console.log('updateFieldsInForm llamada con datos:', JSON.stringify(authorData));
    return originalUpdateFieldsInForm.apply(this, arguments);
  };
}
