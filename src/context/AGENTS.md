# src/context

## Purpose
React contexts for shared state across the NexusViewer Markdown Viewer.

## Ownership
Agent

## Local Contracts
- Each context has three files: `<name>ContextDef.ts` (types + `createContext`), `<Name>.tsx` (provider component), `use<Name>.ts` (hook).
- Providers export only the component; hooks export only the hook; context defs export only types and the `createContext` value. This keeps React Fast Refresh happy.
- On Windows, do not name any new file `fileContext.*` or `toastContext.*` — it collides (case-insensitive) with `FileContext.tsx` / `Toast.tsx`. Use a distinct suffix like `fileContextDef.ts` / `toastContextDef.ts`.

## Work Guidance
- Providers own all state for their slice. Components read/write through the corresponding hook.
- All IPC access goes through the global `window.electron` (typed by `electron/preload.d.ts`).

## File-specific contracts

### FileContext (file state)
- `fileContextDef.ts` — exports `FileContext`, `FileContextType`, `FileState`.
- `FileContext.tsx` — exports `FileProvider` only.
- `useFile.ts` — exports `useFile` hook only.
- Auto-save debounces 2s after the last edit when enabled.
- `closeFile()` resets state to `{ filePath: null, content: '', isDirty: false }`.

### Toast (notifications)
- `toastContextDef.ts` — exports `ToastContext`, `ToastContextValue`, `ToastVariant`, `ToastAction`.
- `Toast.tsx` — exports `ToastProvider` only.
- `useToast.ts` — exports `useToast` hook only.
- Toasts auto-dismiss after 3.5s. Variants: `info`, `success`, `error`, `warning`. Provider is mounted once near the root and renders a fixed bottom-right stack.
- `show(message, variant?, action?)` accepts optional `ToastAction` (`{ label, onClick }`) for an action button (used e.g. for [Reload] on external file changes).
- Context value is memoized via `useMemo` so consumers stay stable across renders.

## Verification
- `npm run build` must pass — type-only re-exports and `verbatimModuleSyntax` are honored.
- `npm run lint` must pass — no fast-refresh violations.

## Child DOX Index
None
