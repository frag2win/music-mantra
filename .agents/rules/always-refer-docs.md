# Rule: Always Refer to DOCS Folder

## Mandatory Documentation Reference

Before writing any code, making architectural decisions, or answering questions about this project, **always read and reference the documents in the `DOCS/` folder** at the project root.

## Document Hierarchy (Priority Order)

1. **`DOCS/TRD-swara-healing-web.md`** — The Technical Requirements Document is the **single source of truth** for all product requirements, functional specifications, audio/DSP parameters, application state machine, data model, security requirements, and acceptance criteria. Every implementation decision must be traceable back to a section in this document.

2. **`DOCS/BUILDING-PLAN.md`** — The phased building plan defines the implementation roadmap (Phase 0 through Phase 4), folder structure, API endpoints, database schema, and key decisions. Refer to this before starting any new phase or feature.

3. **`DOCS/IMPLEMENTATION-REPORT.md`** — The implementation report documents what has already been built, which algorithms were chosen and why, test results, design decisions, and known limitations. Check this before re-implementing or modifying existing modules.

4. **`DOCS/CHANGELOG.md`** — The annotated changelog provides context for every significant commit: what changed, why, which files were affected, and the impact. Refer to this for understanding the project's evolution.

## Rules

- **Before implementing any feature:** Check the TRD for the exact requirement (FR-1 through FR-13) and acceptance criteria.
- **Before creating a new module:** Check the BUILDING-PLAN for the designated file path and folder structure.
- **Before modifying existing code:** Check the IMPLEMENTATION-REPORT for the original design rationale.
- **After completing any significant work:** Update the CHANGELOG with an annotated entry and update the IMPLEMENTATION-REPORT if a phase milestone was reached.
- **When answering questions about the project:** Cite the relevant DOCS section and provide file links.
- **DSP parameters:** Always use the exact values from TRD §6 (window size, hop size, thresholds, etc.) — do not deviate without documenting the change.
- **Accuracy formula:** Always use the exact formula from TRD §6.5 — the tuning system (just intonation vs equal temperament) is a critical design parameter.
