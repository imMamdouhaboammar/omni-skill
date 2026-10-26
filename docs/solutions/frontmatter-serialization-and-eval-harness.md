# Frontmatter Serialization & Evaluation Harness Integrity

## Context & Root Cause

1. **Accessibility Compliance (WCAG 2.2 SC 2.1.1, SC 1.3.1, SC 2.3.3)**:
   - Screen reader landmarks (`<main>`) were absent from `public/index.html` and `eval_review.html`.
   - Table header cells (`<th>`) lacked explicit `scope="col"` attributes, impairing table navigation in accessibility screen readers.
   - Micro-transitions on cards and toggle switches lacked `@media (prefers-reduced-motion: reduce)` fallbacks.

2. **YAML Frontmatter Serialization Integrity (#9)**:
   - Raw string interpolation inside `compiler.ts` and `compile_spec.py` (`name: ${name}\ndescription: >\n  ${description}`) caused syntax corruption and potential YAML key injection when descriptions contained colons, quotes, hashes, multiline text, leading punctuation, or Unicode.
   - Solved by using the existing `yaml` serializer in TypeScript (`stringifyYaml`) and safe YAML serialization in Python with PyYAML (`safe_dump`) and deterministic scalar fallback formatting.

3. **Evaluation Harness Evidence Enforcement (#1)**:
   - The CLI `eval` command previously printed synthetic 100% success unconditionally, even when evaluation files were absent or empty, or without executing assertions against candidate responses.
   - Solved by implementing an evidence-derived evaluation engine requiring candidate responses (`--candidate` or `--responses`), failing closed with non-zero exit codes when unverified, empty, missing, or assertion-violating. Added `--json` output format and regex syntax validation.
