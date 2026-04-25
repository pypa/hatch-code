/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: mocha-param uses this */
import * as assert from 'node:assert'
import { before, beforeEach } from 'mocha'
import * as vscode from 'vscode'
import type { HatchExecutableTracker } from '../src/cli'
import execFile from '../src/cli/exec-file'
import {
	ENVS_EXT_ID,
	EXE_CONFIG_SECTION,
	EXE_CONFIG_SETTING,
	EXTENSION_ID,
} from '../src/common/constants'
import type * as extension from '../src/extension'
import type {
	EnvironmentManager,
	PythonEnvironmentApi,
} from '../src/vscode-python-environments'
import MockExec from './mock-exec'
import { tmpdir, waitForCondition } from './utils'

const getExtApi = (() => {
	const apis: {
		[EXTENSION_ID]?: extension.Api
		[ENVS_EXT_ID]?: PythonEnvironmentApi
	} = {}

	async function getApi(
		id: typeof EXTENSION_ID,
		timeoutMs?: number,
	): Promise<extension.Api>
	async function getApi(
		id: typeof ENVS_EXT_ID,
		timeoutMs?: number,
	): Promise<PythonEnvironmentApi>
	async function getApi(
		id: keyof typeof apis,
		timeoutMs?: number,
	): Promise<extension.Api | PythonEnvironmentApi> {
		if (apis[id]) {
			return apis[id]
		}

		const extension = vscode.extensions.getExtension(id)
		assert.ok(extension, `Extension ${id} not found`)

		if (!extension.isActive) {
			await extension.activate()
			await waitForCondition(
				() => extension.isActive,
				timeoutMs,
				'Extension did not activate',
			)
		}

		apis[id] = extension.exports
		return extension.exports
	}

	return getApi
})()

describe('Env Manager', () => {
	vscode.window.showInformationMessage('Start all tests.')

	const mockExec = new MockExec('ReplaceMe')
	beforeEach(() => mockExec.reset())

	let api: PythonEnvironmentApi
	let exe: HatchExecutableTracker
	let envManager: EnvironmentManager
	before(async function () {
		this.timeout(50_000)
		api = await getExtApi(ENVS_EXT_ID, 20_000)
		assert.ok(api, 'Evironments extension API not available')
		const ext = await getExtApi(EXTENSION_ID, 20_000)
		assert.ok(ext.envManager, 'Hatch extension API not available')
		exe = ext.exe
		envManager = ext.envManager
	})

	for (const value of [
		{
			name: 'mock',
			exec: mockExec,
			setup(): undefined {
				mockExec.reset(
					[
						['env', 'show', '--json'],
						{ mockenv: { type: 'virtual' } },
					],
					[['env', 'find', 'mockenv'], 'mockpath\n'],
				)
			},
		},
		{
			name: 'real',
			exec: execFile,
			async setup() {
				const conf =
					vscode.workspace.getConfiguration(EXE_CONFIG_SECTION)
				const old = await conf.get<string>(EXE_CONFIG_SETTING)
				await conf.update(EXE_CONFIG_SETTING, '')
				return {
					[Symbol.asyncDispose]: () =>
						conf.update(EXE_CONFIG_SETTING, old),
				}
			},
		},
	])
		it(`should return environments ${value.name}`, async () => {
			exe.exec = value.exec
			await using dir = await tmpdir('hatch-')
			api.addPythonProject({ name: 'test', uri: dir.uri })

			await using _ = await value.setup()
			await envManager.refresh(dir.uri)
			const envs = await envManager.getEnvironments(dir.uri)

			assert.ok(envs.length > 0, 'No environments found')
			assert.equal(envs[0].name, 'mockenv')
			assert.equal(envs[0].sysPrefix, 'mockpath')
		})
})
