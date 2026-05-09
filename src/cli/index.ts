import type { ExecFileException } from 'node:child_process'
import untildify from 'untildify'
import type { ConfigurationChangeEvent } from 'vscode'
import {
	type Disposable,
	type LogOutputChannel,
	window,
	workspace,
} from 'vscode'
import which from 'which'
import { EXE_CONFIG_SECTION, EXE_CONFIG_SETTING } from '../common/constants.js'
import { createDeferred, type Deferred } from '../common/deferred.js'
import { traceError } from '../common/logging.js'
import execFile, { type ExecFile } from './exec-file.js'
import type { CreateEnvOptions, HatchEnvInfo } from './hatch.js'
import Hatch from './hatch.js'
import Installer, { type InstallOptions } from './installer.js'

export type { HatchEnvInfo }

const EXE_CONFIG_KEY = `${EXE_CONFIG_SECTION}.${EXE_CONFIG_SETTING}`
const VIEW_LOGS = 'View Logs'

function isExecFileError(e: unknown): e is ExecFileException {
	return typeof (e as ExecFileException).stderr === 'string'
}

/** Suggest to update the configuration if an error occurs */
function suggestExeConfig<
	This extends { readonly log: LogOutputChannel },
	Args extends unknown[],
	Return,
>(target: (this: This, ...args: Args) => Promise<Return>) {
	return async function (this: This, ...args: Args) {
		try {
			return await target.call(this, ...args)
		} catch (e) {
			const result = await window.showErrorMessage(
				`Error executing hatch: ${e}. Maybe you need to update "${EXE_CONFIG_KEY}" in your settings.`,
				VIEW_LOGS,
			)
			if (result === VIEW_LOGS) this.log.show()
			traceError(e, ...(isExecFileError(e) ? [e.stderr] : []))
			throw e
		}
	}
}

export class HatchExecutableTracker {
	#executable: Deferred<string>
	#configChangeListener: Disposable
	constructor(
		readonly log: LogOutputChannel,
		public exec: ExecFile = execFile,
	) {
		this.#executable = createDeferred()
		this.#configChangeListener = workspace.onDidChangeConfiguration((e) =>
			this.#handleConfigChange(e),
		)
	}

	async #initialize(): Promise<void> {
		if (!this.#executable.completed) {
			this.#executable.resolve(await getHatch())
		}
	}

	async #handleConfigChange(e: ConfigurationChangeEvent): Promise<void> {
		if (e.affectsConfiguration(EXE_CONFIG_KEY)) {
			this.#executable.resolve(await getHatch())
		}
	}

	dispose() {
		this.#configChangeListener.dispose()
	}

	get executable(): Promise<string> {
		return this.#initialize().then(() => this.#executable.promise)
	}

	get #hatch(): Promise<Hatch> {
		return this.executable.then((e) => new Hatch(e, this.exec))
	}

	get #inst(): Promise<Installer> {
		return this.executable.then((e) => new Installer(e, this.exec))
	}

	@suggestExeConfig
	async getEnvs(projectPath: string): Promise<HatchEnvInfo[]> {
		return (await this.#hatch).getEnvs(projectPath)
	}
	@suggestExeConfig
	async findEnv(env: HatchEnvInfo): Promise<string> {
		return (await this.#hatch).findEnv(env)
	}
	@suggestExeConfig
	async removeEnv(env: HatchEnvInfo): Promise<void> {
		return (await this.#hatch).removeEnv(env)
	}
	@suggestExeConfig
	async createEnv(env: HatchEnvInfo, opts?: CreateEnvOptions): Promise<void> {
		return (await this.#hatch).createEnv(env, opts)
	}

	@suggestExeConfig
	async listPackages(
		env: HatchEnvInfo,
	): Promise<{ name: string; version: string }[]> {
		return (await this.#inst).listPackages(env)
	}
	@suggestExeConfig
	async installPackages(
		env: HatchEnvInfo,
		packages: string[],
		opts: InstallOptions = {},
	): Promise<void> {
		return (await this.#inst).installPackages(env, packages, opts)
	}
	@suggestExeConfig
	async uninstallPackages(
		env: HatchEnvInfo,
		packages: string[],
	): Promise<void> {
		return (await this.#inst).uninstallPackages(env, packages)
	}
}

async function getHatch(): Promise<string> {
	const value =
		workspace
			.getConfiguration(EXE_CONFIG_SECTION)
			.get<string>(EXE_CONFIG_SETTING) ?? ''
	if (value.length > 0) return untildify(value)
	const path = await which('hatch', { nothrow: true })
	if (!path) {
		const errorMsg = `Hatch executable not found. Please install Hatch or set "${EXE_CONFIG_KEY}" in your settings.`
		window.showErrorMessage(errorMsg)
		throw new Error(errorMsg)
	}
	return path
}
