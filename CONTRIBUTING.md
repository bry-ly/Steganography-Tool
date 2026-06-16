# Contributing

Thanks for your interest in StegnoHide. Bug reports, documentation fixes, and small patches are all welcome.

## Development Setup

Requirements:

- Node.js **20+**
- pnpm **9+** (the repo pins a version via `packageManager` in `package.json`)

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest run
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
pnpm build      # next build
```

## Pull Requests

1. Fork the repository and create a feature branch.
2. Make your change. If it affects a code path, add or update a Vitest case in `tests/`.
3. Run `pnpm lint && pnpm typecheck && pnpm test` locally — all three must pass.
4. Keep the diff focused. Don't refactor unrelated code in the same PR.
5. Open a PR with a clear description of the problem and the approach.

## Coding Conventions

- TypeScript strict mode is on. No `any`, no `// @ts-ignore` without a comment explaining why.
- The `lib/` modules are pure (no DOM, no `window`). New helpers that need DOM go in a new file.
- UI strings live in the component that renders them — there's no i18n framework yet. Don't introduce one without discussion.
- Follow the existing file layout: app entry points under `app/`, page sections under `components/`, domain logic under `lib/`.
- Don't add dependencies for things you can write in <30 lines.

## Documentation

Doc pages are MDX in `content/docs/`. The Fumadocs site picks them up automatically. To add a new page:

1. Create `content/docs/<section>/<page>.mdx` with frontmatter (`title`, `description`, optional `icon`).
2. Add the file to the section's `meta.json` `pages` array so it appears in the sidebar.

The full project layout is documented in [`content/docs/getting-started`](./content/docs/getting-started/index.mdx).

## Reporting Bugs

Open a GitHub issue with:

- A short, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Browser + OS
- Screenshots or sample files if relevant

## Security

**Do not file public issues for security vulnerabilities.** See [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT license](./LICENSE).
