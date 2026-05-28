import { Uri, workspace } from 'vscode'
import type { HatchEnvManager } from './hatch-env-manager.js'

export interface CommandOptions {
	/** environment name */
	env?: string | undefined
	/** workspace directory */
	workspace?: string | undefined
}

/** Command to get the interpreter for a given environment.
 *
 * Modeled after [`python.interpreterPath`].
 *
 * [`python.interpreterPath`]: https://github.com/microsoft/vscode-python/blob/9ded8032f6a455289113026ed1dca4c5ed81e6e8/src/client/interpreter/interpreterPathCommand.ts
 */
export async function getEnvInterpreter(
	envManager: HatchEnvManager,
	{ env: envName = 'default', workspace: wsDir }: CommandOptions = {},
): Promise<string> {
	const workspaceUri = wsDir
		? Uri.file(wsDir)
		: workspace.workspaceFolders?.[0]?.uri
	if (!workspaceUri) throw new Error('No workspace open')
	await envManager.refresh(workspaceUri)
	const envs = await envManager.getEnvironments(workspaceUri)
	const env = envs.find((e) => e.name === envName)
	if (!env)
		throw new Error(
			`Environment “${envName}” not found in workspace “${workspaceUri.fsPath}”`,
		)
	return env.execInfo.run.executable
}
