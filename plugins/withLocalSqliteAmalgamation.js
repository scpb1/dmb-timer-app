const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SQLITE_VERSION = '3450300';
const MARKER = 'withLocalSqliteAmalgamation';
const REMOTE_SRC =
  'src("https://www.sqlite.org/2024/sqlite-amalgamation-${SQLITE_VERSION}.zip")';

/**
 * Point expo-sqlite's Gradle download at the vendored amalgamation zip.
 * EAS builders often cannot reach sqlite.org (Network is unreachable).
 */
function withLocalSqliteAmalgamation(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const gradlePath = path.join(
        projectRoot,
        'node_modules',
        'expo-sqlite',
        'android',
        'build.gradle'
      );
      const vendorZip = path.join(
        projectRoot,
        'vendor',
        `sqlite-amalgamation-${SQLITE_VERSION}.zip`
      );

      if (!fs.existsSync(vendorZip)) {
        throw new Error(
          `[${MARKER}] Missing ${vendorZip}. Commit vendor/sqlite-amalgamation-${SQLITE_VERSION}.zip.`
        );
      }
      if (!fs.existsSync(gradlePath)) {
        throw new Error(`[${MARKER}] expo-sqlite android/build.gradle not found`);
      }

      const contents = fs.readFileSync(gradlePath, 'utf8');
      if (contents.includes(MARKER)) {
        return config;
      }
      if (!contents.includes(REMOTE_SRC)) {
        throw new Error(
          `[${MARKER}] Could not find sqlite.org download URL in expo-sqlite. The package may have changed.`
        );
      }

      const fileUrl = `file:///${vendorZip.replace(/\\/g, '/')}`;
      fs.writeFileSync(
        gradlePath,
        contents.replace(REMOTE_SRC, `src("${fileUrl}") // ${MARKER}`)
      );
      return config;
    },
  ]);
}

module.exports = withLocalSqliteAmalgamation;
