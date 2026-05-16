const { withAppBuildGradle } = require('@expo/config-plugins');

// Inserts a release signingConfig into android/app/build.gradle so that
// `./gradlew assembleRelease` (and `expo run:android --variant release`)
// produce a production-signed APK/AAB when android/keystore.properties exists.
//
// The keystore.properties file holds the actual secret values and is git-ignored.
// If the file is absent, release builds silently fall back to the debug keystore
// — same behaviour as a freshly prebuilt Expo project.
module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        'withAndroidReleaseSigning only supports Groovy build.gradle files.',
      );
    }
    cfg.modResults.contents = patchBuildGradle(cfg.modResults.contents);
    return cfg;
  });
};

const KEYSTORE_LOADER = `
    // Load release keystore properties from android/keystore.properties if present.
    // The file is git-ignored — keep a secure backup of both the .keystore file and the password.
    def keystorePropertiesFile = rootProject.file('keystore.properties')
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }

    signingConfigs {`;

const RELEASE_SIGNING_CONFIG = `
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

function patchBuildGradle(contents) {
  // 1. Replace the "signingConfigs {" block opener with our keystore.properties loader.
  let patched = contents;
  if (!patched.includes("rootProject.file('keystore.properties')")) {
    patched = patched.replace(/    signingConfigs \{/, KEYSTORE_LOADER);
  }

  // 2. Inject the release signingConfig right after the closing brace of `debug { ... }`
  //    inside the signingConfigs block. We match the first `signingConfigs { ... debug { ... } }`.
  if (!patched.includes('signingConfigs.release')) {
    patched = patched.replace(
      /(signingConfigs \{[\s\S]*?debug \{[\s\S]*?\})(\s*\})/,
      `$1${RELEASE_SIGNING_CONFIG}$2`,
    );
  }

  // 3. In the release buildType, swap `signingConfig signingConfigs.debug` for the
  //    conditional that prefers the release config when keystore.properties is present.
  patched = patched.replace(
    /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
    "$1signingConfig keystorePropertiesFile.exists() ? signingConfigs.release : signingConfigs.debug",
  );

  return patched;
}
