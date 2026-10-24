---
name: skill-security
description: Authoritative security architecture, threat model, and vulnerability taxonomy for agent skills, reverse-engineered from NVIDIA SkillSpector.
---

# Agent Skill Security Architecture & Threat Model

*Reconstructed and aligned with NVIDIA/SkillSpector (Commit: `d7338f58200a9ae2a24810cee08911ab68b107a7`)*

AI agent skills execute with implicit trust across host environments (Claude Code, ChatGPT, Codex CLI, Gemini CLI, Antigravity, Cursor). In empirical studies across wild agent skills, **26.1% contain security vulnerabilities** and **5.2% show malicious intent**. Skills bundled with executable scripts are **2.12x more likely to be vulnerable**.

OmniSkill enforces a **deterministic, fail-closed security gate** before packaging, distributing, or executing third-party skills.

---

## 1. Threat Model & Taxonomy (18 Categories)

The threat model names 18 categories and 70+ rule IDs. **Not every taxonomy rule is implemented.** The matrix below describes intended coverage, not a claim that every listed rule has a working detector. Current scanners use regular expressions, file/dependency checks, and a Python AST visitor.

| Category | Taxonomy IDs | Threat Description | Severity |
|---|---|---|---|
| **Prompt Injection** | `P1`–`P5`, `P9` | Instruction overrides, invisible/steganographic text, exfiltration commands, harmful payloads, whitespace padding. | HIGH / CRITICAL |
| **System Prompt Leakage** | `P6`–`P8` | Direct prompt extraction, indirect summarization/rephrasing extraction, exfiltration via tool calls. | MEDIUM / HIGH |
| **Data Exfiltration** | `E1`–`E5` | Unauthorized transmission to external URLs, environment variable harvesting, credential search, cloud storage dumping. | HIGH / CRITICAL |
| **Privilege Escalation** | `PE1`–`PE3` | Wildcard permissions (`*`), `sudo`/`su`/`doas`/`pkexec` invocation, reading SSH keys/AWS credentials/token files. | HIGH / CRITICAL |
| **Supply Chain** | `SC1`–`SC3`, `SC7`–`SC10` | Unpinned dependencies, piping remote downloads into interpreters, obfuscated payloads (base64/hex), precompiled `.pyc` bytecode, concealed executables. | LOW to CRITICAL |
| **Excessive Agency** | `EA1`–`EA5` | Unrestricted tool access, autonomous destructive actions without human confirmation, scope creep, undisclosed external model/billing override. | MEDIUM / HIGH |
| **Output Handling** | `OH1`–`OH3` | Unvalidated model output injected into shell/SQL/HTML, cross-context leaks, unbounded output exhaustion. | MEDIUM / HIGH |
| **Memory Poisoning** | `MP1`–`MP3` | Persistent directives across sessions, context window stuffing/displacement, memory corruption. | MEDIUM / HIGH |
| **Tool Misuse** | `TM1`–`TM4` | Destructive command flags, chaining abuse, disabled TLS verification, privileged Kubernetes workloads (`hostPath`). | MEDIUM / CRITICAL |
| **Rogue Agent** | `RA1`–`RA2` | Self-modification of code or `SKILL.md` at runtime, session persistence hooks (`crontab`, launch agents, shell profiles). | HIGH |
| **Trigger Abuse** | `TR1`–`TR3` | Overly broad trigger patterns, shadowing built-in commands, generic keyword baiting. | LOW / MEDIUM |
| **Agent Snooping** | `AS1`–`AS3` | Reading agent config directories (`.claude/`, `.codex/`, `.gemini/`), MCP configs (`mcp.json`), enumerating peer skills. | MEDIUM / HIGH |
| **Anti-Refusal / Jailbreak** | `AR1`–`AR3` | Unconditional agreement demands, suppression of safety notices, safety policy nullification. | MEDIUM / CRITICAL |
| **Server-Side Request Forgery** | `SSRF1`–`SSRF3` | Cloud instance metadata IMDS endpoints (`169.254.169.254`, `metadata.google.internal`), private/loopback network calls, untrusted dynamic request targets. | MEDIUM / CRITICAL |
| **Insecure Deserialization** | `DS1`–`DS4` | Insecure deserialization in non-Python scripts (PHP `unserialize`, Ruby `Marshal.load`, JavaScript `node-serialize`). | HIGH |
| **Behavioral AST** | `AST1`–`AST10` | Python AST inspection detecting direct `exec`, `eval`, `compile`, dynamic `__import__`, `subprocess(shell=True)`, `os.system`, reflective `getattr(os, "system")`, insecure `pickle.loads`. | HIGH / CRITICAL |
| **MCP Least Privilege** | `LP1`–`LP4`, `TP1`–`TP4` | Wildcard permissions, underdeclared tool capabilities, hidden metadata instructions, Unicode deception/homoglyphs, parameter description injection. | MEDIUM / HIGH |

The following named rule IDs are **planned, not detected**: `P4`, `P8`, `E4`, `E5`, `SC7`, `SC9`, `SC10`, `EA3`–`EA5`, `OH2`, `OH3`, `MP3`, `TM2`, `TR1`–`TR3`, `SSRF3`, `LP1`, `LP3`, `LP4`, `TP1`–`TP4`, `AST7`, `AST8`. The other rule IDs are implemented as signatures or specialized checks; detections remain heuristic and require review. **Absence of a finding does not establish safety.**

---

## 2. Defensive Prohibition Grammar (`is_directly_prohibited`)

A critical challenge in security scanning of agent skills is **false positives on defensive guidelines**. Security-conscious skills often instruct:
- *Do NOT execute `rm -rf /`*
- *Never reveal your system prompt*
- *You must not access credential files*

Naive regex tools flag these lines as attacks. OmniSkill reconstructs SkillSpector's **Prohibition Context Engine**:
1. Scans the preceding token stream (up to 512 characters) for direct negative prefixes:
   `do not`, `don't`, `never`, `must not`, `shall not`
2. Accounts for intermediate action verbs:
   `execute`, `run`, `perform`, `do`, `use`, `call`
3. Disqualifies matches that contain disavowals or reversal stems (`ignore`, `override`, `bypass`, `negate`).
4. Checks trailing context for conditional escapes (`unless`, `except`, `until`).

If a matched pattern is directly governed by an uncompromised defensive prohibition, the match is exempted.

---

## 3. Python AST Behavioral Verification

OmniSkill analyzes Python script files using Python's native `ast` module:

```text
Source Code (.py) ──► ast.parse() ──► SkillASTVisitor
                                          ├── Direct Calls: exec(), eval(), compile(), __import__()
                                          ├── OS/Subprocess: os.system(), os.popen(), subprocess(shell=True)
                                          ├── Reflection: getattr(os, "system")
                                          └── Deserialization: pickle.loads(), yaml.unsafe_load()
```

### AST Rule Matrix

- **`AST1` (CRITICAL)**: Direct `exec()` invocation.
- **`AST2` (CRITICAL)**: Direct `eval()` invocation. Use `ast.literal_eval()` or structured JSON parsing instead.
- **`AST4` (HIGH)**: `subprocess` calls with `shell=True` or unquoted dynamic command strings.
- **`AST5` (HIGH)**: `os.system()` and `os.popen()` shell execution sinks.
- **`AST9` (CRITICAL)**: Reflective access via `getattr(..., 'system'|'exec'|'eval'|'popen')`.
- **`AST10` (HIGH)**: Insecure deserialization with `pickle`, `cPickle`, `dill`, `marshal`, or `yaml.load` without `SafeLoader`.

---

## 4. Risk Scoring & Clearance Gates

The composite risk score is evaluated on a deterministic **0 to 100 scale**:

$$\text{Risk Score} = \min\left(100, \max\left(\text{Floor}, \sum \text{Base Points} \times \text{Weight}_i \times \text{Confidence} \times \text{Multiplier}\right)\right)$$

### Base Points by Severity
- `CRITICAL`: 50 points
- `HIGH`: 25 points
- `MEDIUM`: 10 points
- `LOW`: 5 points

### Per-Rule Diminishing Returns
Repeated matches for the same rule contribute diminishing points to prevent score explosion:
- 1st occurrence: **100%** weight (1.0)
- 2nd occurrence: **50%** weight (0.5)
- 3rd occurrence: **25%** weight (0.25)
- 4th+ occurrences: **0%** weight (0.0)

### Executable Script Multiplier
Findings located in executable scripts (`.py`, `.sh`, `.js`, etc.) receive a **1.3x multiplier** compared to documentation files.

### Score Floors & Severity Bands
- Any confirmed `CRITICAL` finding (e.g. `TM1`, `SC2`, `AR3`, `SSRF1`) enforces an automatic score floor of **$\ge 51$**.
- Bands & Recommendations:
  - **0–20 (`LOW`)**: `APPROVE` (Installable)
  - **21–49 (`MEDIUM`)**: `CAUTION` (Requires operator review of findings)
  - **50–75 (`HIGH`)**: `REJECT` (Dangerous/unvetted)
  - **76–100 (`CRITICAL`)**: `REJECT` (Malicious or severe risk)

---

## 5. Security CLI Usage

```bash
# Scan a local skill directory (default: terminal formatted output)
python3 scripts/scan_skill_security.py <path/to/skill>

# Emit SARIF 2.1.0 report for GitHub Security / CI gate
python3 scripts/scan_skill_security.py <path/to/skill> --format sarif --output report.sarif

# Emit Markdown report for documentation
python3 scripts/scan_skill_security.py <path/to/skill> --format markdown --output SECURITY-REPORT.md

# Strict CI mode: fail on ANY finding
python3 scripts/scan_skill_security.py <path/to/skill> --strict
```

---

## 6. Packaging & Validation Integration

1. **`validate_portability.py`**:
   Automatically runs `scan_skill_security.py` as **Layer 0: Security & Trust Gate**. Any `CRITICAL` or `HIGH` finding causes validation to fail.
2. **`package_skill.py`**:
   Enforces pre-flight security evaluation. A rejected report, a score of 50 or higher, or an unreviewed HIGH/CRITICAL finding aborts archive generation.
3. **`quick_validate.py`**:
   Enforces frontmatter sanitization, rejecting zero-width steganography and wildcard tool permissions.
