# How to contribute

## Understanding the setup

The scripts in `packagage.json` are used to manage this project.

- running `yarn install` runs the `postinstall` script, which.
  1. sets up `pre-commit` scripts that run `lint`s (see below) before each `git commit`.
  2. downloads `src/vscode-python-environments.ts` which isn’t published to npm yet.
- `watch` and `compile` can be used to compile the TypeScript sources,
  but “Run Extension” in `.vscode/launch.json` also runs `watch` for you.
- `lint` runs the following:
  - `lint:check` runs the Biome linter and formatter.
  - `lint:deps` runs `depcheck` to see if we have superfluous dependencies.
- `vsce-package` builds the VS Code extension.

## updating the logo
- edit `assets/hatch-logo.fig` with Figma
- export to SVG
- convert to font using https://icomoon.io/
- replace `assets/hatch-logo.woff2`

(The logo.png is a copy of the regular Hatch logo, resized to 128px.)

## CI/CD tokens

To update the `MARKETPLACE_TOKEN` secret,
we can follow the [“publishing extensions” tutorial](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

Azure is weird, so in order to create an organization-independent PAT to publish extensions to the marketplace,
one still needs access to an organization.

I personally have access to the `scverse` org so I’ll use that:
[token settings](https://dev.azure.com/scverse/_usersSettings/tokens) (Select “Access scope: **All accessible organizations**” in the filter list)

