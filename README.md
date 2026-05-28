# Hatch Code
An extension to manage [Hatch environments] through [`vscode-python-environments`][].

To make use of it, make sure your user settings contain `"python.useEnvironmentsExtension": true`.

[hatch environments]: https://hatch.pypa.io/latest/tutorials/environment/basic-usage/
[`vscode-python-environments`]: https://github.com/microsoft/vscode-python-environments/#readme

## Features
- List all configured [Hatch environments]
- Provide controls to set them as active environment for your project, activate them in a terminal, and delete them from disk
- Temporarily modify an environment’s packages using the configured [`installer`]
- Define a `hatch.envInterpreter` command for use in `launch.json` or `tasks.json`, see [below](#commands)

![screenshot](./screenshot.png)

Since many actions currently use `hatch run` and therefore sync the environment, temporary package changes can be quickly undone, especially removing packages installed as dependencies.
Persistent modifications to the installed packages should be done by editing Hatch’s `envs` configuration.

[`installer`]: https://hatch.pypa.io/latest/how-to/environment/select-installer/

## Commands
- `hatch.envInterpreter`: not an interactive command, but rather for use in `launch.json` or `tasks.json` via [variable substitution], e.g. for `program` in `tasks.json` or `python` in `launch.json`:

  ```jsonc
  {  // tasks.json
    "version": "0.2.0",
    "tasks": [
      {
        "type": "process",
        "program": "${command:hatch.envInterpreter?[\"docs\"]}",
        "args": ["-m", "sphinx", "docs", "docs/_build"],
      },
    ],
  }
  ```

  When called without arguments, it returns the path to the `default` hatch environment of the currently open workspace.
  The first parameter is the environment name as reported by Hatch.
  The second parameter is an explicit workspace folder in case you have multiple workspaces open.

  (The syntax for specifying arguments in command Uris is an URL-encoded JSON array that has to be embedded in the `launch.json`/`tasks.json`. Quite cumbersome, but shouldn’t be an issue for common env names.)

[variable substitution]: https://code.visualstudio.com/docs/editor/userdefinedsnippets

## Extension Settings
- `hatch.executable`: path to the `hatch` executable (supports `~` expansion). Defaults to the output of `which hatch`.

## Limitations
- It’s pretty unclear which environments exist on disk and which don’t
- We list internal envs that users don’t usually interact with, such as `hatch-uv` and `hatch-build`
