# AGENTS.md

## Purpose

This repository builds `skill2mcp`, a tooling project for transforming SKILL definitions into MCP-compatible artifacts and servers.

The codebase must evolve as a product, not as a demo. Every change should improve operational clarity, maintainability, and delivery speed with strict token efficiency during collaboration.

## Scope of Rules

- `AGENTS.md` defines transversal engineering and collaboration rules.
- Product/business directives and domain-specific decisions must be consulted in `ROADMAP.md` when that file is present.
- If there is any conflict, prioritize explicit product directives documented in `ROADMAP.md`.

## Core Engineering Rules

### 1. Prefer Product Architecture Over Generic Scaffolding

- Build around product domains, not around framework folders alone.
- Favor vertical modules for business capabilities.
- Keep infrastructure and framework details outside business logic.

### 2. Apply SOLID Pragmatically

- Single Responsibility: each file should have one clear reason to change.
- Open/Closed: extend behavior through new modules/services instead of bloating existing files.
- Liskov: keep interfaces predictable and avoid hidden behavior changes.
- Interface Segregation: expose small, focused contracts.
- Dependency Inversion: controllers depend on services, services depend on repositories/clients via explicit construction.

### 3. Use Clean Architecture Boundaries

- Views render state, not business rules.
- Controllers coordinate request/response flow only.
- Services contain domain logic, orchestration, derivations, and validation.
- Repositories own persistence.
- Integration clients own communication with external APIs.
- Config files own environment/bootstrap concerns.

### 4. Build With Component Thinking

Even with EJS:

- `views/pages`: page composition only.
- `views/components`: reusable UI blocks with simple inputs.
- `views/partials`: global layout fragments.
- Avoid large monolithic templates.
- Prefer reusable sections over duplicated markup.

### 5. Backend Must Stay Boring and Readable

- Once a coding task is approved, implement it cleanly, efficiently, and with a bias for the simplest robust solution.
- Respect the existing logic, architecture, and patterns of the repository instead of forcing parallel approaches.
- When implementing new code or modifying existing code, prioritize correct typing that matches the repository's existing patterns and logic to minimize CI/CD failures caused by typing errors or omissions.
- Protect current behavior aggressively: avoid regressions and do not break working flows while delivering the requested change.
- Use explicit names.
- Keep functions small.
- Prefer plain objects over clever abstractions.
- Avoid unnecessary framework magic.
- Reject premature generalization.

## Repository Structure Guidance

Use this shape as the preferred direction:

```text
src/
  config/
  controllers/            # only if still needed for global/simple pages
  middlewares/
  modules/
    <domain>/
      *.controller.js
      *.service.js
      *.repository.js
      *.routes.js
  shared/
    database/
    integrations/
    utils/
  views/
    layouts/
    partials/
    components/
    pages/
```

Rules:

- New product features should prefer `src/modules/<feature>`.
- Shared logic that is not domain-specific goes in `src/shared`.
- Do not move domain logic into `public/js`.

## Branching and Delivery Rules

- Never implement or commit development changes directly on `main`.
- Every implementation must happen in a branch named `feat/<tag>` or another explicit non-`main` working branch agreed for the task.
- `main` is reserved for integrated code only.
- Before doing `commit`, `push`, and `merge` for any completed coding task, explicitly report to the user:
  - your `%` of satisfaction with the achieved result
  - your `%` estimate that CI/CD will not fail
- Delivery order must always be:
  - `commit` on the working branch (`feat/<tag>` or `fix/<tag>`)
  - `push` the working branch first
  - `merge` into the productive target branch (`main` or `develop`, as applicable)
  - `push` the productive target branch last
- Merge into `main` is allowed only after the work is completed in a feature branch. Prefer GitHub CI/CD or the repository review flow; a local merge is acceptable only as the final integration step, never as the working branch for development.
- If work is currently on `main`, stop and create a feature branch before continuing.
- Before any `git commit` or `git push`, explicitly verify the current branch is not `main`.
- If the current branch is `main`, stop immediately and create or switch to a `feat/<tag>` or `fix/<tag>` branch before committing.
- This rule also applies to follow-up fixes, post-review adjustments, and small corrective commits: no direct commits on `main` under any circumstance.

## Frontend Rules

- Server-render first.
- Use JavaScript only where it adds real interaction value.
- Centralize browser behavior in `public/js/app.js` or small, deliberate expansions from there.
- Use `data-*` hooks for behavior binding.
- Do not introduce frontend complexity unless it clearly pays for itself.

## Styling Rules

- Respect the active Bootswatch theme.
- Avoid hardcoded colors when Bootstrap variables or utility classes can do the job.
- Prefer subtle surfaces and spacing over decorative UI noise.
- Prioritize information density where the screen is operational, especially dashboards and monitoring tables.

## Data and Security Rules

- Never expose secrets in UI.
- Never persist secrets per workflow if the instance is global.
- Do not store raw user passwords; store hashes only.
- Avoid storing sensitive data unless product value clearly requires it.
- Prefer environment-driven infrastructure configuration.
- Never ship a local development SQLite database inside deployment artifacts.
- Production database state must never be replaced by any database file coming from the repository or local workspace.

## Database Rules

- Use migrations/bootstrap changes deliberately.
- Add only the columns that support clear product behavior.
- Keep schema names explicit and operationally meaningful.
- Model relationships to reflect product reality, not convenience alone.
- Any change to the data model must generate and include a migration or an equivalent explicit schema-evolution step.
- Never leave schema changes implicit only inside runtime bootstrap logic if they affect existing persisted data.

## Token Efficiency Rules

This section is mandatory and takes priority during day-to-day collaboration.

The repository should be developed with a strict bias toward high cost-efficiency in:

- user input tokens
- assistant output tokens
- internal reasoning tokens
- file-reading and code-exploration scope

### 1. Conversation Must Be Economical

- Default to short, direct answers.
- Do not restate obvious context.
- Do not narrate every small step.
- Do not produce long explanations unless the user explicitly asks for depth.
- Do not generate broad plans when a small concrete action is enough.
- Use the minimum number of words required to preserve clarity.

### 2. Reasoning Must Be Narrow and Deliberate

- Think only as far as needed to safely solve the task.
- Prefer verification over speculation.
- Prefer local evidence over theoretical discussion.
- Read only the files required for the current decision.
- Avoid chain-of-thought expansion when the task can be solved from a few concrete facts.
- If a simple solution works, do not spend tokens searching for a more elegant abstraction.

### 3. File and Code Inspection Must Be Minimal

- Do not scan the whole repository unless the task truly requires it.
- Inspect the smallest relevant surface first.
- Reuse known module boundaries and existing patterns.
- Avoid opening secondary files unless they are needed to complete or verify the change.

### 4. Implementation Must Minimize Cost

- Change the fewest files necessary.
- Prefer local edits over widespread refactors.
- Avoid introducing dependencies unless they produce clear long-term savings.
- Avoid writing generic infrastructure before there is a real product need.

### 5. Output Must Optimize Signal Density

- Status updates should be short and factual.
- Final answers should emphasize result, verification, and remaining risk.
- Avoid educational padding, repeated summaries, and ceremonial language.
- When referencing code, prefer a few precise file references over long walkthroughs.

### 6. Default Operating Rule

When in doubt, choose the option that uses fewer tokens while preserving:

- correctness
- architectural coherence
- maintainability
- user comprehension

Verbose output is an exception, not the default.

## Decision Heuristics

When choosing between two solutions, prefer the one that:

- reduces domain ambiguity
- keeps module boundaries clearer
- lowers future token and maintenance cost
- improves operational visibility
- avoids UI or backend overengineering

## What To Avoid

- Fat controllers
- Business logic inside EJS
- Repeated API calls scattered across modules
- Framework-driven folder sprawl without domain meaning
- Storing infrastructure secrets in records or forms
- Large speculative abstractions
- Refactors that consume many tokens but produce little product value

## Expected Coding Style

- Explicit, modular, simple
- Small functions with stable contracts
- Clear naming over cleverness
- Product-first structure
- Operational UX over decorative UX

## Collaboration Preference

When working in this repository:

- default to the smallest correct change
- preserve momentum
- keep architecture coherent
- optimize for long-term maintainability and low conversation cost
- When sending input tokens to the LLM provider, use `Prompt Caching` intelligently to reduce repeated prompt cost and preserve context efficiency.

## Intermediary Updates

- Commentary updates must stay short and factual, ideally 1-2 sentences.
- Send an update only when the task changes state materially: start, before edits, after verification, when blocked, or when resuming.
- Do not narrate every command, file, or micro-decision.
- Batch related progress into one message instead of sending several small ones.
- Keep the detailed explanation for the final response; commentary is for coordination only.

## Branching and Commits

- Never implement or commit changes directly on `main`.
- Always create and use a working branch like `feat/<slug>` or `fix/<slug>` before editing code.
- Commit messages must start with `[AI]`.
