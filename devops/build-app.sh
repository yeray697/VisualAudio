#!/usr/bin/env bash
set -e

# -------------------------
# CONFIGURACIÓN (EDITA ESTO)
# -------------------------
PWA_URL="https://visualaudio.dev/tv"
APP_ID="com.example.visualaudio"
APP_NAME="VisualAudio"
KEYSTORE="devops/android.keystore"
KEY_ALIAS="android"
KEY_PASS="12345678"
APK_UNSIGNED="src/frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk"
APK_SIGNED="src/frontend/android/app/build/outputs/apk/release/app-release-signed.apk"
ADB_TARGET="192.168.1.23:5555"

# Ruta al SDK instalado por Bubblewrap
ANDROID_SDK="$HOME/.bubblewrap/android_sdk"

# -------------------------
# FUNCIONES
# -------------------------
function ensure_keystore() {
  if [ ! -f "$KEYSTORE" ]; then
    echo "Keystore no encontrado. Creando uno nuevo..."
    keytool -genkeypair -v \
      -keystore "$KEYSTORE" \
      -alias "$KEY_ALIAS" \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -storepass "$KEY_PASS" \
      -keypass "$KEY_PASS" \
      -dname "CN=VisualAudio, OU=Dev, O=Personal, L=Ciudad, ST=Provincia, C=ES"
    echo "Keystore creado en $KEYSTORE"
  fi
}

function setup_capacitor() {
  cd "src/frontend"
  if [ ! -d "android" ]; then
    echo "Carpeta Android no existe. Inicializando Capacitor..."
    npx cap init "$APP_NAME" "$APP_ID" --web-dir capacitor-empty
    npx cap add android
  else
    echo "Carpeta Android ya existe. Sincronizando cambios..."
    npx cap sync android
  fi
  
  echo "Copiando assets de la web y añadiendo permiso de micrófono..."
  npx cap copy android
  node ../../devops/add-microphone-permission.js
  node ../../devops/add-supports-screens.js

  cd ../..
}

function build_apk() {
  echo "Compilando APK..."
  cd src/frontend/android
  ./gradlew assembleRelease --no-daemon
  cd ../../..
}

function sign_apk() {
  if [ ! -f "$APK_UNSIGNED" ]; then
    echo "ERROR: APK no encontrado en $APK_UNSIGNED"
    exit 1
  fi

  echo "Firmando APK..."
  "$ANDROID_SDK/build-tools/35.0.0/apksigner.bat" sign \
    --ks "$KEYSTORE" \
    --ks-pass pass:"$KEY_PASS" \
    --key-pass pass:"$KEY_PASS" \
    --out "$APK_SIGNED" "$APK_UNSIGNED"

  if [ ! -f "$APK_SIGNED" ]; then
    echo "ERROR: APK firmado no encontrado en $APK_SIGNED"
    exit 1
  fi
}

function install_apk() {
  echo "Instalando APK en Android TV ($ADB_TARGET)..."
  adb -s "$ADB_TARGET" install -r "$APK_SIGNED"
  echo "APK instalada."
}

# -------------------------
# EJECUCIÓN
# -------------------------
echo "=== Iniciando flujo completo de build y deploy ==="
ensure_keystore
setup_capacitor
build_apk
sign_apk
install_apk
echo "=== Todo listo! La app debería abrirse en /tv en tu Android TV ==="
