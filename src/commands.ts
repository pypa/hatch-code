import { Uri, workspace } from 'vscode'
import type { HatchEnvManager } from './hatch-env-manager.js'

/** Command to get the interpreter for a given environment.
 *
 * Intended to be used via [variable substitution] like `"${command:hatch.envInterpreter?[\"hatch-test.py3.14\"]}"`.
 * Modeled after [`python.interpreterPath`].
 *
 * [variable substitution]: https://code.visualstudio.com/docs/debugtest/tasks#_variable-substitution
 * [`python.interpreterPath`]: https://github.com/microsoft/vscode-python/blob/9ded8032f6a455289113026ed1dca4c5ed81e6e8/src/client/interpreter/interpreterPathCommand.ts
 */
export async function getEnvInterpreter(
	envManager: HatchEnvManager,
	envName: string | undefined = 'default',
	workspaceDir?: string | undefined,
): Promise<string> {
	const workspaceUri = workspaceDir
		? Uri.file(workspaceDir)
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
