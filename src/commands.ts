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
	env: string | undefined = 'default',
	workspaceDir?: string | undefined,
): Promise<string> {
	const workspaceUri = workspaceDir
		? Uri.file(workspaceDir)
		: workspace.workspaceFolders?.[0]?.uri
	await envManager.refresh(workspaceUri)
	const envs = await envManager.getEnvironments(workspaceUri ?? 'all')
	return envs.find((e) => e.name === env)?.execInfo.run.executable ?? 'python'
}
