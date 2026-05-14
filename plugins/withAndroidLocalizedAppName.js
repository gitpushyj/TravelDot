const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Maps Apple-style locale codes (also used by our /locales/app-name JSON files)
// to Android resource qualifier directory names.
const ANDROID_QUALIFIER = {
  ko: 'ko',
  ja: 'ja',
  'zh-Hans': 'zh-rCN',
  'zh-Hant': 'zh-rTW',
  es: 'es',
  de: 'de',
  fr: 'fr',
  it: 'it',
  ru: 'ru',
};

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"');
}

module.exports = function withAndroidLocalizedAppName(config, options = {}) {
  const sourceDir = options.sourceDir || 'locales/app-name';

  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const resDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
      );

      for (const [appleCode, qualifier] of Object.entries(ANDROID_QUALIFIER)) {
        const jsonPath = path.join(projectRoot, sourceDir, `${appleCode}.json`);
        if (!fs.existsSync(jsonPath)) continue;

        const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const appName = raw.CFBundleDisplayName || raw.CFBundleName;
        if (!appName) continue;

        const targetDir = path.join(resDir, `values-${qualifier}`);
        fs.mkdirSync(targetDir, { recursive: true });
        const targetFile = path.join(targetDir, 'strings.xml');
        const xml = `<resources>\n  <string name="app_name">${escapeXml(appName)}</string>\n</resources>\n`;
        fs.writeFileSync(targetFile, xml);
      }

      return cfg;
    },
  ]);
};
