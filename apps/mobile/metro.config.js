const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// The workspace root has React 18 (for web) and mobile has React 19.
// Without this, Metro can bundle both and cause "Invalid hook call" crashes.
// resolveRequest intercepts every import of react/* and hard-routes it to
// mobile's own node_modules so only one React instance ever enters the bundle.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    try {
      return {
        filePath: require.resolve(moduleName, {
          paths: [path.resolve(projectRoot, 'node_modules')],
        }),
        type: 'sourceFile',
      };
    } catch (_) {}
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
