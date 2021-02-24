import {
  addConversionsPlugin,
  declareMissingClassPropertiesPlugin,
  eslintFixPlugin,
  explicitAnyPlugin,
  hoistClassStaticsPlugin,
  jsDocPlugin,
  memberAccessibilityPlugin,
  reactClassLifecycleMethodsPlugin,
  reactClassStatePlugin,
  reactDefaultPropsPlugin,
  reactPropsPlugin,
  reactShapePlugin,
  stripTSIgnorePlugin,
  tsIgnorePlugin,
  Plugin,
} from "ts-migrate-plugins";
import { MigrateConfig, migrate as tsmigrate } from "ts-migrate-server";
import { asSuccess, asFailure, Status } from "../helpers";

// TODO: config aliases
const anyAlias = undefined;
const anyFunctionAlias = undefined;
const defaultAccessibility = undefined;
const privateRegex = undefined;
const protectedRegex = undefined;
const publicRegex = undefined;

interface MigrateParams {
  rootDir: string;
  tsConfigDir?: string;
  sources?: string | string[];
}
const migrate = async (params: MigrateParams): Promise<Status> => {
  const config = new MigrateConfig()
    .addPlugin(stripTSIgnorePlugin, {})
    .addPlugin(hoistClassStaticsPlugin, { anyAlias })
    .addPlugin(reactPropsPlugin, {
      anyAlias,
      anyFunctionAlias,
      shouldUpdateAirbnbImports: true,
    })
    .addPlugin(reactClassStatePlugin, { anyAlias })
    .addPlugin(reactClassLifecycleMethodsPlugin, { force: true })
    .addPlugin(reactDefaultPropsPlugin, {
      useDefaultPropsHelper: false,
    })
    .addPlugin(reactShapePlugin, {
      anyAlias,
      anyFunctionAlias,
    })
    .addPlugin(declareMissingClassPropertiesPlugin, { anyAlias })
    .addPlugin(memberAccessibilityPlugin, {
      defaultAccessibility,
      privateRegex,
      protectedRegex,
      publicRegex,
    })
    .addPlugin(explicitAnyPlugin, { anyAlias })
    .addPlugin(addConversionsPlugin, { anyAlias })
    // We need to run eslint-fix before ts-ignore because formatting may affect where
    // the errors are that need to get ignored.
    .addPlugin(eslintFixPlugin, {})
    .addPlugin(tsIgnorePlugin, {})
    // We need to run eslint-fix again after ts-ignore to fix up formatting.
    .addPlugin(eslintFixPlugin, {});

  const exitCode = await tsmigrate({ ...params, config });
  return exitCode === 0 ? asSuccess() : asFailure(`calling ts-migrate failed!`);
};

export default migrate;
