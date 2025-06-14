console.log('Comprobando campos del formulario disponibles:');
document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { console.log('IDs de los campos de formulario:', Array.from(document.querySelectorAll('[id^="field-"]')).map(el => el.id)); }, 2000); });
