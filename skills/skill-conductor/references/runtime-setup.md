# Runtime setup

Run a capability pre-flight before executing scripts or dynamic evals.

The runtime contract is host-aware. Do not make one provider CLI or API key a requirement for every Conductor mode.

## 1. Decide whether execution is needed

Pure design and review work can proceed without an external CLI:

- capture/reconstruct SkillSpec
- choose architecture and freedom
- review instructions
- build eval plans
- compare host contracts

Do not block these modes because `uv`, `claude`, an API key, shell, or Python is missing.

## 2. Portable Python scripts

The v4 portability utilities use Python 3 standard library and can run with host-native Python when available:

```bash
python3 scripts/compile_skill_spec.py --spec <spec.json> --out <dir>
python3 scripts/validate_portability.py <skill-dir> --targets <hosts>
python3 scripts/test_portability.py
```

If the current host exposes a Python tool instead of a shell command, execute the equivalent script through that host capability and preserve the execution evidence.

Do not claim these checks ran unless a real runtime executed them.

## 3. Existing eval toolchain

Some legacy/eval scripts use inline dependencies and still expect `uv run`.

For those scripts only:

```bash
command -v uv >/dev/null || command -v ~/.local/bin/uv >/dev/null
```

If `uv` is absent, report that the applicable legacy runner is unavailable. Do not turn that into a failure of CREATE, REVIEW, PORT, or static validation.

## 4. Provider-specific adapters

### Claude Code

The existing scripts below are Claude-oriented:

- `scripts/run_eval.py`
- `scripts/run_loop.py`
- `scripts/improve_description.py`

They may use the `claude` CLI and/or Anthropic credentials. Their event parsing and trigger evidence are specific to Claude Code.

If using them, verify the actual Claude runtime first. Examples may include an authenticated `claude` CLI or an Anthropic SDK path when the script supports it.

Do not require `ANTHROPIC_API_KEY` for ChatGPT, Codex, Agent Skills baseline, or static Conductor work.

### ChatGPT

Use the capabilities exposed by the current ChatGPT surface. When host-native Python is available, prefer it for deterministic generation/validation. Use actual ChatGPT Skill/Plugin invocation for discovery evidence.

Do not simulate ChatGPT triggering by running the Claude adapter.

### Codex

Use the current Codex workspace/sandbox capabilities. Read/search before mutation; use patch/write only within the user's authorization; use shell/Python when exposed and appropriate.

Use actual Codex Skill/Plugin invocation for discovery evidence.

### Custom host

Follow its documented runtime contract. If no executable adapter exists, generate static artifacts and an eval plan, then mark dynamic evidence unverified.

## 5. Capability pre-flight record

Before an execution-dependent claim, record the relevant capabilities:

```text
host: <name>
python: available | unavailable | unknown
shell: available | unavailable | unknown
subagents: available | unavailable | unknown
network: available | restricted | unavailable | unknown
discovery_test: executable | not executable
package_test: executable | not executable
```

Do not ask for capabilities the current mode does not need.

## 6. Cross-host rule

A provider-specific runner proves only the behavior it actually observed.

- Claude trigger result -> Claude evidence
- ChatGPT invocation -> ChatGPT evidence
- Codex invocation -> Codex evidence
- static validator -> artifact evidence

Never promote one of these into a universal claim.
