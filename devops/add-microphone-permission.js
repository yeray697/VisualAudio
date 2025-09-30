const fs = require('fs');
const path = require('path');

// Ajusta la ruta a tu proyecto Android generado
const manifestPath = path.join(
  __dirname,
  '../src/frontend/android/app/src/main/AndroidManifest.xml'
);

if (!fs.existsSync(manifestPath)) {
  console.error(
    '⚠️ AndroidManifest.xml no encontrado, asegúrate de haber corrido "npx cap add android"'
  );
  process.exit(1);
}

let manifest = fs.readFileSync(manifestPath, 'utf8');

if (!manifest.includes('android.permission.RECORD_AUDIO')) {
  manifest = manifest.replace(
    '<manifest',
    `<manifest\n    xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="android.permission.RECORD_AUDIO"/>`
  );
  fs.writeFileSync(manifestPath, manifest);
  console.log('✅ Permiso de micrófono añadido al manifest');
} else {
  console.log('✅ Permiso de micrófono ya existe');
}
