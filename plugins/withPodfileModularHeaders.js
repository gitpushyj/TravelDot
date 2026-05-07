const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Required by @react-native-firebase on iOS when use_frameworks! :static is set.
// Adds `use_modular_headers!` so React-Core / GoogleUtilities expose module maps
// to the Firebase Swift pods.
module.exports = function withPodfileModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const original = fs.readFileSync(podfilePath, 'utf-8');
      if (original.includes('use_modular_headers!')) {
        return cfg;
      }
      const patched = original.replace(
        /(use_frameworks![^\n]*\n)+/,
        (match) => `${match}  use_modular_headers!\n`,
      );
      fs.writeFileSync(podfilePath, patched);
      return cfg;
    },
  ]);
};
