import { commands, type ExtensionContext, window } from 'vscode'
import { HatchExecutableTracker } from './cli/index.js'
import { type CommandOptions, getEnvInterpreter } from './commands.js'
import { CMD_ENV_INTERPRETER, EXTENSION_ID } from './common/constants.js'
import { registerLogger } from './common/logging.js'
import { setWorkspacePersistentState } from './common/persistent-state.js'
import { HatchEnvManager } from './hatch-env-manager.js'
import { HatchPackageManager } from './hatch-pkg-manager.js'
import { getEnvExtApi } from './python-envs-api.js'

export interface Api {
	exe: HatchExecutableTracker
	envManager: HatchEnvManager
	pkgManager: HatchPackageManager
}

export async function activate(context: ExtensionContext): Promise<Api> {
	const log = window.createOutputChannel('Hatch', { log: true })
	context.subscriptions.push(log, registerLogger(log))

	const exe = new HatchExecutableTracker(log)
	const api = await getEnvExtApi()
	setWorkspacePersistentState(context)
	const envManager = new HatchEnvManager(api, exe, log)
	const pkgManager = new HatchPackageManager(api, exe, log)
	context.subscriptions.push(
		exe,
		api.registerEnvironmentManager(envManager, {
			extensionId: EXTENSION_ID,
		}),
		api.registerPackageManager(pkgManager, { extensionId: EXTENSION_ID }),
		commands.registerCommand(CMD_ENV_INTERPRETER, (args?: CommandOptions) =>
			getEnvInterpreter(envManager, args),
		),
	)

	return {
		exe,
		envManager,
		pkgManager,
	}
}

export function deactivate() {}
