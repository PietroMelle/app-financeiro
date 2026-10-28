## Projeto

App pessoal de finanças (Vite + React + JavaScript, sem TypeScript; Tailwind v4; shadcn/ui em JS; Motion; Supabase). Escopo, decisões e ordem das fatias: `docs/spec.md`.

- **UI:** siga `design-system/mea-financas/MASTER.md` (tokens, tipografia, movimento, checklist). Tela com regras próprias: `design-system/mea-financas/pages/<tela>.md`.
- **Banco:** toda mudança de schema vira migração em `supabase/migrations/`; teste de RLS em `supabase/tests/rls_test.sql`.
- **Verificação:** `npm test`, `npm run build`, `npm run lint`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (PietroMelle/app-financeiro), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
