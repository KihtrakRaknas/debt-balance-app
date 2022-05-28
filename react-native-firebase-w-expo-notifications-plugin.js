// https://github.com/expo/expo/pull/15010
const expoConfigPlugins = require('@expo/config-plugins');

const firebaseIID = 'com.google.firebase:firebase-iid';
const iidVersion = '17.0.2';

function addDependency(buildGradle) {
  if (!buildGradle.includes(firebaseIID)) {
    // TODO: Find a more stable solution for this
    buildGradle = buildGradle.replace(
      /dependencies\s?{/,
      `dependencies {
        implementation '${firebaseIID}:${iidVersion}'`,
    );
  }
  return buildGradle;
}

/**
 * Update `app/build.gradle` by adding firebase-iid dependency
 */
module.exports = function withAndroidFirebaseId(config) {
  return expoConfigPlugins.withAppBuildGradle(config, (config) => {
    config.modResults.contents = addDependency(config.modResults.contents);
    return config;
  });
};