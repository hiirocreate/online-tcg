// モノレポ構成（npm workspaces）でshared/を参照できるようにするMetro設定。
// 参考: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// モノレポルート（shared/等）の変更を監視する
config.watchFolders = [workspaceRoot];

// ルートのnode_modulesも解決対象に含める
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
