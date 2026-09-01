---
name: omni-skill
description: >
  Dynamic agentic router and master compiler for high-reliability agent skills across
  ChatGPT, Codex, Claude Code, Google Antigravity, and Cursor. Use when a user asks
  to route, design, architect, evaluate, improve, port, package, or distribute agent skills —
  even if they don't explicitly say "omni-skill" (e.g. "teach Claude X", "port to Cursor",
  "publish skill to github", "run evals"). Do NOT use for general non-agent coding tasks.
---

# OmniSkill: Dynamic Agentic Router & Skill Engine

Build and distribute skills as tested behavioral artifacts with zero vendor lock-in.

The dynamic execution invariant is:

$$\text{Intent (Any Lang)} \xrightarrow{\text{Dynamic Router}} \text{Execution DAG} \xrightarrow{\text{Host Contract}} \text{Skill Engine} \xrightarrow{\text{BinEval Gate}} \text{Release (All Agents)}$$

---

## ⚡ Dynamic Agentic Routing

For any prompt in natural language (English, Arabic, etc.), the router classifies intent, extracts target hosts, and constructs an optimal multi-step Directed Acyclic Graph (DAG):

```bash
# Analyze prompt and generate dynamic execution DAG
omni-skill route "<user request>" [--host claude|antigravity|cursor|codex] [--explain]
```

- Deep router architecture, DAG generation rules & recovery loops → **`references/agentic-router.md`**

---

## Start Here

For every request, establish these four facts before editing:

1. **Job**: the repeatable task the skill must improve
2. **Failure**: what the target agent does wrong without the skill
3. **Host**: where the skill must run (Claude, Antigravity, Cursor, Codex, Windsurf, Universal)
4. **Evidence**: how success and non-trigger behavior will be checked

Read only what the mode needs:
- `references/agentic-router.md` for dynamic intent routing and DAG execution
- `references/skill-spec.md` for CREATE, IMPROVE, or PORT
- `references/host-profiles.md` when selecting or adapting a host
- `references/sop-practices.md` before authoring or reviewing skill instructions
- `references/pressure-testing.md` for wording micro-tests and discipline skills
- `references/bineval-method.md` and `references/quality-questions.md` for scoring
- `references/cross-host-evaluation.md` for multi-host evidence
- `references/runtime-setup.md` before executing scripts or runners

---

## Mode Router

| Mode | Use when | Primary result |
| --- | --- | --- |
| CREATE | build a new skill | SkillSpec + implementation + eval set |
| IMPROVE | existing skill is weak or unreliable | smallest evidence-backed edits |
| VALIDATE | test a skill | structural, discovery, behavior, and portability evidence |
| REVIEW | assess a third-party skill | pass/fail risks before installation |
| OPTIMIZE | trigger wording is the main problem | held-out description candidate |
| PORT | adapt a skill to another agent/host | target-host variant + gap report |
| PACKAGE | bundle a standalone artifact | .skill archive or host plugin package |
| DISTRIBUTE | craft high-presence repo & distribute | manifests (package.json, marketplace.json, .skills.json, install.sh) + GitHub repo & CI |

Execution Pipeline: **CREATE/IMPROVE -> PORT -> VALIDATE -> PACKAGE -> DISTRIBUTE**

---

## Internal Skill Routing

`skill-conductor` is the public orchestrator. Helper skills handle specialized boundaries:

| Helper skill | Activate when | Return control when |
| --- | --- | --- |
| `skill-conductor` | full-lifecycle BinEval scoring, trigger optimization loops, or .skill packaging is needed | evaluation, optimization, or packaging is complete |
| `repo-craft-and-distribute` | scaffolding multi-agent distribution manifests, crafting high-presence GitHub repo, or fixing Mermaid diagrams | distribution manifests, CI, and repo setup are verified |
| `host-workspace-operator` | inspecting, searching, patching, writing, or verifying workspace files | required workspace mutation is complete |
| `sandbox-python-executor` | compilation, parsing, archive inspection, hashing, or deterministic Python helpers | execution evidence is captured |

---

## Mode 1: CREATE

1. **Prove baseline failure**: Identify 1-2 realistic scenarios where the model fails without the skill.
2. **Write SkillSpec**: Draft triggers (3 positive, 2 near-miss negatives), invariants, and concrete outputs → **`references/skill-spec.md`**.
3. **Choose Pattern & Freedom**: Select sequential, iterative, context-aware, or domain pattern (Low, Medium, or High freedom per step) → **`references/patterns.md`**.
4. **Author via Progressive Disclosure**: Keep `SKILL.md` as routing map (<500 lines); place schemas and reference guides in `references/` → **`references/sop-practices.md`**.
5. **Build Evals First**: Construct positive, negative, and pressure test cases before implementation.
6. **Compile & Validate**:
   ```bash
   omni-skill init <skill-name> -d "<description>"
   omni-skill validate <skill-dir>
   ```

---

## Mode 2: IMPROVE

1. **Diagnose failure class**: Map failure to undertriggering, overtriggering, body bypass, sequence gap, or freedom mismatch.
2. **Freeze eval split**: Maintain strict 70% train / 30% held-out eval partition; do not train on held-out prompts.
3. **Surgical edits**: Apply at most 3 atomic changes per iteration.
4. **Re-validate & verify gates**: Accept candidate only if train score improves without breaking held-out cases.

---

## Mode 3: VALIDATE & EVAL

Run the 4-layer validation pipeline:
1. **Layer 1: Artifact Structural Lint**: Valid YAML, naming convention, reference depth, no secrets.
   ```bash
   omni-skill validate <skill-dir>
   ```
2. **Layer 2: Trigger Discovery**: Test 3 direct positives, 3 indirect positives, 3 near-miss negatives across target hosts.
3. **Layer 3: Behavioral Assertions**: Run BinEval assertions and rubric questions → **`references/bineval-method.md`**.
   ```bash
   omni-skill eval <skill-dir>
   ```
4. **Layer 4: Portability Evidence**: Check tool, filesystem, and packaging compatibility for each claimed host → **`references/cross-host-evaluation.md`**.

---

## Mode 4: REVIEW

Assess third-party skills before installation or repository adoption:
- Discovery scope, triggers, and negative boundaries.
- Workflow utility vs generic boilerplate advice.
- Progressive disclosure compliance and secret leakage.
- Output classification: **`installable`**, **`repairable`**, or **`reject`**.

---

## Mode 5: OPTIMIZE

Use when trigger wording or discovery is the primary failure:
1. Generate realistic prompt bank with hard negatives.
2. Run train/test split optimization loop with canonical description formula.
3. Verify held-out candidates on target hosts.

---

## Mode 6: PORT

Port behavior, not branding:
1. **Extract Universal Core**: Job, triggers, workflow invariants, knowledge resources, deterministic scripts.
2. **Strip Host-Specific Mechanics**: Remove hardcoded tool names, directory paths, or single-agent CLI commands.
3. **Apply Target Host Profile**: Map capabilities to target host → **`references/host-profiles.md`**.
4. **Compile & Output**:
   ```bash
   omni-skill port <skill-dir> --target claude|cursor|codex|antigravity
   ```

---

## Mode 7: PACKAGE

Bundle release-ready artifacts:
1. Run pre-package validation gate.
2. Generate standalone `.skill` zip archive and host-native manifests.
   ```bash
   omni-skill package <skill-dir>
   ```

---

## Mode 8: DISTRIBUTE

Turn a verified skill into a high-presence GitHub repository distributed across the entire ecosystem:
1. Scaffold multi-agent distribution layer:
   ```bash
   bun skills/repo-craft-and-distribute/scripts/scaffold-repo.ts <skill-dir> --name "<name>"
   ```
2. Review generated manifests: `package.json`, `marketplace.json`, `.skills.json`, `install.sh`, `.github/workflows/ci.yml`.
3. Follow the full distribution canon → **`skills/repo-craft-and-distribute/SKILL.md`**.

---

## Reference Map

| Path | Purpose & Content |
|---|---|
| `references/agentic-router.md` | Dynamic intent classification, DAG execution, and self-healing loops |
| `references/skill-spec.md` | Universal design contract and freedom calibration |
| `references/host-profiles.md` | Host capability contracts (Claude, Codex, Antigravity, Cursor) |
| `references/cross-host-evaluation.md` | Multi-host evaluation gates and portability matrices |
| `references/patterns.md` | Core architecture patterns and anti-patterns |
| `references/sop-practices.md` | The 10 authoring principles and procedural workflow methodology |
| `references/pressure-testing.md` | Micro-tests and discipline pressure scenarios |
| `references/bineval-method.md` | BinEval binary evaluation, scoring, and gates |
| `references/quality-questions.md` | Fixed quality rubric question bank |
| `references/schemas.md` | JSON schemas for specs, evals, benchmarks, and manifests |
| `references/runtime-setup.md` | Execution environments, CLI dependencies, and tool setup |
