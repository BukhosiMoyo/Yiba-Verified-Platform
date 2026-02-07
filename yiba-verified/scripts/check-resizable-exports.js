const pkg = require('react-resizable-panels');
console.log('Exports:', Object.keys(pkg));
try {
    console.log('PanelGroup:', pkg.PanelGroup);
} catch (e) {
    console.log('Error accessing PanelGroup:', e);
}
