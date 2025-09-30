const fs = require('fs');
const path = require('path');

const manifestPath = path.join(
  __dirname,
  '../src/frontend/android/app/src/main/AndroidManifest.xml'
);

if (!fs.existsSync(manifestPath)) {
  console.error(
    'AndroidManifest.xml no encontrado, ejecuta primero npx cap sync android'
  );
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, 'utf8');

// Verifica si ya existe la etiqueta
if (!xml.includes('<supports-screens')) {
  // Inserta justo antes del cierre del <manifest>
  const insert = `
    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:anyDensity="true" />`;

  xml = xml.replace('</manifest>', `${insert}\n</manifest>`);
  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('supports-screens agregado correctamente al manifest.');
} else {
  console.log('supports-screens ya está presente.');
}
