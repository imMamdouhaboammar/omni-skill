#!/usr/bin/env python3
"""
Feature Reconstruction: Agent Skill Security Scanner
Reverse-Engineered from: NVIDIA/SkillSpector (https://github.com/NVIDIA/SkillSpector)
Commit: d7338f58200a9ae2a24810cee08911ab68b107a7
Evidence Digests:
  - pattern_defaults.py: sha256:cf261bacc18d2bff49b13fa164ab3a5dce65145a610e59a725bb17b241e7a984
  - prohibition_context.py: sha256:5d863d294c07911aa7f95e146d6dec43f8445dd38eabaafc86b25121ce867a07
  - behavioral_ast.py: sha256:a301e511e0e1a7fcaebf5be0141b487ff35bb2c3b2800052a2edc82ad76dff2c
  - report.py: sha256:20e64cc5f8cc62216b3e081e2ad041301a981a6722d2a1cfe3009782a39f504a

Deterministic static security analyzer for AI agent skills across Claude Code,
Codex, ChatGPT, Gemini CLI, and Antigravity.
"""

from __future__ import annotations

import argparse
import ast
from dataclasses import asdict, dataclass, field
from enum import Enum
import fnmatch
import json
from pathlib import Path
import re
import sys
import unicodedata

# ---------------------------------------------------------------------------
# Constants & Enums
# ---------------------------------------------------------------------------

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class PatternCategory(str, Enum):
    PROMPT_INJECTION = "Prompt Injection"
    DATA_EXFILTRATION = "Data Exfiltration"
    PRIVILEGE_ESCALATION = "Privilege Escalation"
    SUPPLY_CHAIN = "Supply Chain"
    EXCESSIVE_AGENCY = "Excessive Agency"
    OUTPUT_HANDLING = "Output Handling"
    SYSTEM_PROMPT_LEAKAGE = "System Prompt Leakage"
    MEMORY_POISONING = "Memory Poisoning"
    TOOL_MISUSE = "Tool Misuse"
    ROGUE_AGENT = "Rogue Agent"
    TRIGGER_ABUSE = "Trigger Abuse"
    MCP_LEAST_PRIVILEGE = "MCP Least Privilege"
    MCP_TOOL_POISONING = "MCP Tool Poisoning"
    AGENT_SNOOPING = "Agent Snooping"
    ANTI_REFUSAL = "Anti-Refusal"
    SERVER_SIDE_REQUEST_FORGERY = "Server-Side Request Forgery"
    DESERIALIZATION = "Insecure Deserialization"
    BEHAVIORAL_AST = "Behavioral AST"


_SEVERITY_POINTS = {
    Severity.CRITICAL.value: 50,
    Severity.HIGH.value: 25,
    Severity.MEDIUM.value: 10,
    Severity.LOW.value: 5,
    Severity.INFO.value: 0,
}

_DIMINISHING_WEIGHTS = (1.0, 0.5, 0.25)
_MAX_OCCURRENCES_PER_RULE = len(_DIMINISHING_WEIGHTS)
_RISK_THRESHOLD = 50

# Unicode zero-width characters used for steganography / hidden prompts
ZERO_WIDTH_CHARS = frozenset("\u200B\u200C\u200D\u2060\uFEFF")
# Bidi control characters (Trojan Source CVE-2021-42574)
BIDI_CONTROL_PATTERN = r"[\u202A-\u202E\u2066-\u2069]"

# HTTP Request-issuing anchors across Python and JavaScript
_REQ_ANCHOR = (
    r"(?:requests|httpx|aiohttp|urllib(?:\.request)?|urllib3|session)\s*\.\s*"
    r"(?:get|post|put|patch|delete|head|request|urlopen)|fetch|axios(?:\.\w+)?|XMLHttpRequest|\bcurl\b|\bwget\b"
)

# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------

@dataclass
class Finding:
    rule_id: str
    message: str
    severity: Severity
    category: PatternCategory
    file: str
    line: int
    matched_text: str
    confidence: float = 1.0
    explanation: str = ""
    remediation: str = ""
    context: str = ""


@dataclass
class ScanReport:
    target_path: str
    skill_name: str
    risk_score: int
    severity: str
    recommendation: str
    findings: list[Finding] = field(default_factory=list)
    files_analyzed: int = 0
    passed: bool = True

    def to_dict(self) -> dict:
        data = asdict(self)
        data["findings"] = [
            {
                **asdict(f),
                "severity": f.severity.value,
                "category": f.category.value,
            }
            for f in self.findings
        ]
        return data


# ---------------------------------------------------------------------------
# Rule Metadata (Explanations & Remediations)
# ---------------------------------------------------------------------------

DEFAULT_EXPLANATIONS: dict[str, str] = {
    "P1": "Instruction override pattern detected. Overrides system instructions or safety rules.",
    "P2": "Concealed or invisible instructions detected in comments, base64 blobs, or zero-width text.",
    "P3": "Instructions commanding transmission of session context or user data to external hosts.",
    "P4": "Subtle bias or steering detected that alters agent decision-making outside stated scope.",
    "P5": "Directly harmful or destructive content detected.",
    "P9": "Oversized whitespace padding detected, typically used to hide instructions off-screen.",
    "P6": "Direct extraction pattern attempting to reveal confidential system prompts or directives.",
    "P7": "Indirect extraction attempting to infer system prompts via summary, rephrase, or translation.",
    "P8": "Exfiltration of system prompts via tool calls (logging, writing, or network request).",
    "E1": "External data transmission to remote URL or unvetted network sink.",
    "E2": "Mass environment variable harvesting or searching for secret keys.",
    "E3": "Filesystem enumeration scanning for SSH keys, credentials, or private user files.",
    "E4": "Instructions that leak conversation history or user prompts to external services.",
    "E5": "Unverified cloud storage exfiltration (S3/GCS/Azure blob upload).",
    "PE1": "Skill requests excessive permissions (e.g. wildcard '*' or unnecessary full access).",
    "PE2": "Command invokes sudo, su, doas, pkexec, or setuid elevation.",
    "PE3": "Direct access to sensitive credential files (~/.ssh, ~/.aws, /etc/shadow, token files).",
    "SC1": "Dependencies lack version pinning, allowing potential malicious package updates.",
    "SC2": "Remote script downloading and execution (e.g. curl | bash, wget | python).",
    "SC3": "Obfuscated code payload (base64/hex decode with execution).",
    "SC7": "Disabled container trust or insecure registry configuration.",
    "SC8": "Shipped precompiled Python bytecode (__pycache__, .pyc, .pyo) in skill package.",
    "SC9": "Concealed executable artifact disguised as a document or data file.",
    "SC10": "Dependency source redirection away from canonical package indexes.",
    "EA1": "Unrestricted tool access without least-privilege boundary.",
    "EA2": "Autonomous execution of high-impact or destructive operations without user confirmation.",
    "EA3": "Skill behavior extends significantly beyond its stated purpose (scope creep).",
    "EA4": "Unbounded resource access (infinite loops, unbounded batch downloads).",
    "EA5": "Undisclosed external model or provider override altering billing or trust boundary.",
    "OH1": "Unvalidated model output injected into shell, SQL, or execution contexts.",
    "OH2": "Output flowing across trust contexts without validation.",
    "OH3": "Unbounded output generation allowing resource exhaustion or context stuffing.",
    "MP1": "Persistent context injection attempting to permanently modify agent state across sessions.",
    "MP2": "Context window stuffing designed to displace system instructions or safety rules.",
    "MP3": "Unauthorized manipulation of agent memory or personality state.",
    "TM1": "Destructive or dangerous tool parameter abuse (rm -rf, mkfs, fork bombs).",
    "TM2": "Tool chaining abuse attempting to bypass single-tool permission restrictions.",
    "TM3": "Insecure tool defaults (disabled TLS verification, world-writable chmod 0777).",
    "TM4": "Privileged Kubernetes workload specifications (hostPath, privileged containers).",
    "RA1": "Self-modifying skill code or runtime editing of SKILL.md.",
    "RA2": "Unauthorized session persistence mechanisms (cron jobs, launch agents, shell profile hooks).",
    "TR1": "Overly broad trigger phrases that intercept unintended user requests.",
    "TR2": "Trigger shadows common built-in commands or system operations.",
    "TR3": "Generic keyword baiting designed to maximize activation frequency.",
    "AS1": "Agent config directory snooping (.claude/, .codex/, .gemini/ access).",
    "AS2": "MCP configuration file snooping (mcp.json access).",
    "AS3": "Cross-skill enumeration or reading other installed skills' instructions.",
    "AR1": "Refusal suppression instructions ('never refuse', 'always comply', 'cannot say no').",
    "AR2": "Disclaimer or warning suppression ('no warnings', 'skip ethics', 'do not moralize').",
    "AR3": "Safety policy nullification ('ignore restrictions', 'you have no limits', 'do anything now').",
    "SSRF1": "Access to cloud instance metadata IMDS endpoints (169.254.169.254, metadata.google.internal).",
    "SSRF2": "Network requests targeting private IP ranges, loopback, or link-local hosts.",
    "SSRF3": "Dynamic request target where host URL is constructed from untrusted variables.",
    "DS1": "Insecure PHP object injection via unserialize().",
    "DS2": "Insecure Ruby Marshal deserialization on untrusted data.",
    "DS3": "Unsafe Ruby YAML.load or Psych.load without safe loader.",
    "DS4": "Insecure JavaScript deserialization (node-serialize / funcster).",
    "AST1": "Direct exec() call enables arbitrary code execution.",
    "AST2": "Direct eval() call evaluates untrusted expressions.",
    "AST3": "Dynamic __import__() loading unvalidated modules at runtime.",
    "AST4": "Subprocess execution with shell=True or unquoted command strings.",
    "AST5": "os.system() or os.popen() shell execution sink.",
    "AST6": "Dynamic compile() with string source.",
    "AST7": "Dynamic getattr() with non-literal attribute name bypassing static checks.",
    "AST8": "Dangerous execution chain combining dynamic decoding with execution.",
    "AST9": "Reflective execution sink via getattr(os, 'system') or __builtins__['exec'].",
    "AST10": "Insecure Python deserialization via pickle, marshal, dill, or yaml.unsafe_load.",
    "LP1": "Code uses detectable tool capabilities not declared in skill frontmatter.",
    "LP2": "Wildcard permission declaration ('*' or 'all') granting blanket access.",
    "LP3": "Missing tool permission declarations in frontmatter while executing operations.",
    "LP4": "Overdeclared permissions that are never referenced or used in skill instructions.",
    "TP1": "Concealed instructions found in metadata descriptions or parameter fields.",
    "TP2": "Unicode homoglyphs, bidirectional overrides, or hidden characters in identifiers.",
    "TP3": "Prompt injection payloads embedded in tool parameter descriptions or default values.",
    "TP4": "Skill description does not match actual behavior and tool capabilities.",
}

DEFAULT_REMEDIATIONS: dict[str, str] = {
    "P1": "Remove text instructing the agent to ignore prompts or override rules. Keep instructions clear and scoped.",
    "P2": "Remove hidden comments, base64 payloads, and zero-width characters. Keep all text plain and reviewable.",
    "P3": "Remove instructions transmitting user session or conversation data to external endpoints.",
    "P4": "Ensure instructions are explicit and directly serve the documented purpose without hidden bias.",
    "P5": "Immediately remove dangerous or harmful instructions.",
    "P9": "Eliminate large whitespace padding. Keep markdown files compact and transparent.",
    "P6": "Remove instructions prompting disclosure of internal or system instructions.",
    "P7": "Add explicit rules against summarizing, translating, or paraphrasing internal guidelines.",
    "P8": "Filter system instructions from tool inputs, logs, and external payloads.",
    "E1": "Use documented, vetted API endpoints and verify no user secrets or tokens are sent.",
    "E2": "Read only explicitly named environment variables required for the specific tool.",
    "E3": "Scope file access to explicitly allowed relative workspace paths. Never read credential directories.",
    "E4": "Preserve session privacy; never send chat history or user inputs to external services.",
    "E5": "Verify cloud storage destinations are authenticated and authorized by the operator.",
    "PE1": "Declare only minimal required permissions. Avoid broad wildcards.",
    "PE2": "Avoid sudo/root invocation. Run commands with least privilege.",
    "PE3": "Do not access ~/.ssh, ~/.aws, or token files. Use secure environment managers.",
    "SC1": "Pin exact dependency versions (==) in requirements.txt or pyproject.toml.",
    "SC2": "Do not pipe curl/wget output directly to sh/bash/python. Audit scripts before execution.",
    "SC3": "Remove base64/hex obfuscated execution. Provide readable, inspectable source code.",
    "SC7": "Keep container image trust verification and TLS verification enabled.",
    "SC8": "Delete precompiled __pycache__ and .pyc files prior to packaging.",
    "SC9": "Ensure all executables are explicit script files with standard extensions.",
    "SC10": "Use canonical package repositories (e.g. PyPI, npm) and avoid untrusted index mirrors.",
    "EA1": "Define explicit allowed-tools boundaries in skill frontmatter.",
    "EA2": "Require human confirmation for destructive file modifications, deletion, or remote requests.",
    "EA3": "Restrict instructions strictly to the documented domain task.",
    "EA4": "Add bounded limits, timeouts, and pagination quotas to loops and API requests.",
    "EA5": "Remove hardcoded provider switches or prompt the user for model authorization.",
    "OH1": "Sanitize and quote all model outputs before passing to shell commands, SQL, or HTML.",
    "OH2": "Redact and validate data flowing between differing trust domains.",
    "OH3": "Set strict length and token boundaries on generated outputs.",
    "MP1": "Do not instruct the agent to permanently retain directives across sessions.",
    "MP2": "Eliminate repetitive padding or filler text.",
    "MP3": "Treat agent base rules as immutable.",
    "TM1": "Validate all shell parameters. Reject dangerous flags (--no-preserve-root, -rf /).",
    "TM2": "Decompose tool calls and validate intermediate outputs before downstream chaining.",
    "TM3": "Enforce secure defaults (verify=True on network calls, restrictive file permissions).",
    "TM4": "Remove privileged containers and hostPath mounts from Kubernetes manifests.",
    "RA1": "Treat skill files and SKILL.md as read-only at runtime.",
    "RA2": "Remove cron, systemd, or profile persistence hooks.",
    "TR1": "Narrow trigger phrases to specific, domain-relevant language.",
    "TR2": "Prefix custom command triggers to avoid colliding with built-in commands.",
    "TR3": "Avoid generic keywords that trigger the skill inappropriately.",
    "AS1": "Do not read agent config directories (.claude/, .codex/, .gemini/).",
    "AS2": "Do not inspect mcp.json files directly. Rely on host-provided tool declarations.",
    "AS3": "Do not inspect or read files belonging to other installed skills.",
    "AR1": "Remove anti-refusal phrases. Agents must be allowed to decline unsafe actions.",
    "AR2": "Allow safety warnings and disclaimers to surface to the operator.",
    "AR3": "Remove jailbreak framing attempting to strip agent constraints.",
    "SSRF1": "Block requests to 169.254.169.254 and cloud metadata hostnames.",
    "SSRF2": "Validate request targets against an allowlist and reject private/loopback IP ranges.",
    "SSRF3": "Sanitize and validate dynamic URLs before dispatching network requests.",
    "DS1": "Use json_decode() instead of unserialize() in PHP.",
    "DS2": "Use JSON parsing instead of Marshal.load in Ruby.",
    "DS3": "Use YAML.safe_load instead of YAML.load in Ruby.",
    "DS4": "Use JSON.parse instead of node-serialize in JavaScript.",
    "AST1": "Replace exec() with safe, static dispatch or bounded functions.",
    "AST2": "Replace eval() with ast.literal_eval() or structured parsers.",
    "AST3": "Use standard import statements or explicit module allowlists.",
    "AST4": "Use subprocess.run() with shell=False and an explicit list of string arguments.",
    "AST5": "Replace os.system() with subprocess.run(shell=False, ...).",
    "AST6": "Avoid dynamic compile().",
    "AST7": "Use an explicit dictionary lookup or attribute allowlist instead of dynamic getattr.",
    "AST8": "Do not combine decoding and execution sinks.",
    "AST9": "Avoid reflective invocation of execution functions.",
    "AST10": "Use json for data exchange. For PyTorch use weights_only=True; for YAML use safe_load.",
    "LP1": "Add required tools to allowed-tools in frontmatter or remove unneeded capabilities.",
    "LP2": "Replace wildcard permissions with an explicit list of required tools.",
    "LP3": "Declare required tool capabilities in SKILL.md frontmatter.",
    "LP4": "Remove unused permissions from frontmatter.",
    "TP1": "Remove concealed directives from metadata fields.",
    "TP2": "Use standard ASCII alphanumeric characters for skill names and identifiers.",
    "TP3": "Remove injection patterns from parameter descriptions.",
    "TP4": "Align skill description with actual script implementations.",
}

# ---------------------------------------------------------------------------
# Prohibition Grammar Context Engine
# ---------------------------------------------------------------------------

_CONTEXT_CHARS = 512
_MARKDOWN_STRIP = str.maketrans("", "", "*_`#")
_DIRECT_PREFIX = re.compile(
    r"(?:\A|(?<=[\n\r.!?;,\[]))[ \t]*"
    r"(?:[-+][ \t]+|\d+[.)][ \t]+)?"
    r"(?:please\s+)?"
    r"(?:(?:you|(?:the\s+)?(?:agent|assistant|model))\s+)?"
    r"(?P<negation>do\s+not|don['’]t|never|no|must\s+not|shall\s+not)\s+"
    r"(?:(?:ever|first|verbatim|exactly|word\s+for\s+word)\s+)?"
    r"(?:(?:execute|run|perform|do|use|call|issue)\s+)?\Z",
    re.IGNORECASE,
)
_DISAVOWAL = re.compile(
    r"\b(?:ignore|disregard|override|obsolete|invalid|bypass|suspend|violat\w*|"
    r"opposit\w*|invers\w*|invert\w*|revers\w*|contrar\w*|negat\w*)\b",
    re.IGNORECASE,
)
_EXCEPTION = re.compile(r"\b(?:unless|except|until|but|however|instead)\b", re.IGNORECASE)


_CODE_EXAMPLE_INDICATORS = (
    "```",
    "example:",
    "for example",
    "e.g.",
    "such as",
    "threat description",
    "vulnerability taxonomy",
    "rule matrix",
    "documentation",
    "# warning:",
    "# note:",
    "**warning**",
    "**note**",
    "threat model",
    "taxonomy (",
    "security architecture",
    "sanitization",
    "rejecting",
    "disallowing",
    "validation integration",
    "category | rules",
)


def is_code_example(context: str, file_path: str) -> bool:
    """Return True when context appears to be documentation or code examples in non-SKILL.md files."""
    if file_path.replace("\\", "/").lower().endswith("skill.md"):
        return False
    ctx_lower = context.lower()
    if any(ind in ctx_lower for ind in _CODE_EXAMPLE_INDICATORS):
        return True
    if "|" in context and any(k in ctx_lower for k in ("rules", "severity", "category", "threat")):
        return True
    return False


def is_directly_prohibited(content: str, start: int, end: int) -> bool:
    """
    Check if an identified pattern is governed by a defensive prohibition.
    Example: 'Do NOT execute rm -rf' or 'Never output the system prompt'.
    Prevents false positives on defensive guidelines and negative rules.
    """
    if not (0 <= start < end <= len(content)):
        return False
    left = max(0, start - _CONTEXT_CHARS)
    prefix = content[left:start].translate(_MARKDOWN_STRIP)
    prohibited = _DIRECT_PREFIX.search(prefix)
    if prohibited is None or (left and prohibited.start() == 0):
        return False

    tail = content[end : min(len(content), end + 256)]

    # If quotes surround the entire prohibition phrase (e.g. "- \"Never reveal ...\""), allow it
    leading = prefix[: prohibited.start()]
    quotes_in_leading = leading.count('"') + leading.count("'")
    quotes_in_tail = tail.count('"') + tail.count("'")
    if quotes_in_leading % 2 != 0 and quotes_in_tail % 2 == 0:
        return False

    if _DISAVOWAL.search(leading):
        return False

    first_break = min([tail.find(ch) for ch in (".", "\n", "!", ";", "?") if tail.find(ch) != -1] or [len(tail)])
    clause = tail[:first_break]
    if _EXCEPTION.search(clause):
        return False

    return True


# ---------------------------------------------------------------------------
# Python AST Behavioral Analyzer
# ---------------------------------------------------------------------------

_DANGEROUS_CALLS = {
    "exec": ("AST1", Severity.CRITICAL, "Direct exec() call"),
    "eval": ("AST2", Severity.CRITICAL, "Direct eval() call"),
    "compile": ("AST6", Severity.HIGH, "Dynamic compile() call"),
    "__import__": ("AST3", Severity.HIGH, "Dynamic __import__() call"),
}

_DANGEROUS_GETATTR_NAMES = frozenset({"exec", "eval", "system", "popen", "__import__"})


class SkillASTVisitor(ast.NodeVisitor):
    def __init__(self, filename: str, content: str) -> None:
        self.filename = filename
        self.content = content
        self.lines = content.splitlines()
        self.findings: list[Finding] = []

    def _get_context(self, line: int) -> str:
        idx = max(0, line - 1)
        start = max(0, idx - 1)
        end = min(len(self.lines), idx + 2)
        return "\n".join(self.lines[start:end])

    def visit_Call(self, node: ast.Call) -> None:
        line = getattr(node, "lineno", 1)
        context = self._get_context(line)

        # 1. Direct builtin call (exec, eval, compile, __import__, getattr)
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name in _DANGEROUS_CALLS:
                rule_id, sev, msg = _DANGEROUS_CALLS[func_name]
                self.findings.append(
                    Finding(
                        rule_id=rule_id,
                        message=msg,
                        severity=sev,
                        category=PatternCategory.BEHAVIORAL_AST,
                        file=self.filename,
                        line=line,
                        matched_text=f"{func_name}(...)",
                        confidence=0.95,
                        explanation=DEFAULT_EXPLANATIONS.get(rule_id, ""),
                        remediation=DEFAULT_REMEDIATIONS.get(rule_id, ""),
                        context=context,
                    )
                )
            elif func_name == "getattr" and len(node.args) >= 2:
                target_arg = node.args[1]
                if isinstance(target_arg, ast.Constant) and target_arg.value in _DANGEROUS_GETATTR_NAMES:
                    self.findings.append(
                        Finding(
                            rule_id="AST9",
                            message=f"Reflective execution handle: getattr(..., '{target_arg.value}')",
                            severity=Severity.CRITICAL,
                            category=PatternCategory.BEHAVIORAL_AST,
                            file=self.filename,
                            line=line,
                            matched_text=f"getattr(..., '{target_arg.value}')",
                            confidence=0.95,
                            explanation=DEFAULT_EXPLANATIONS["AST9"],
                            remediation=DEFAULT_REMEDIATIONS["AST9"],
                            context=context,
                        )
                    )

        # 2. Attribute calls: os.system, os.popen, subprocess.*
        elif isinstance(node.func, ast.Attribute):
            attr_name = node.func.attr
            val = node.func.value

            # os.system, os.popen
            if isinstance(val, ast.Name) and val.id == "os" and attr_name in ("system", "popen"):
                self.findings.append(
                    Finding(
                        rule_id="AST5",
                        message=f"Direct os.{attr_name}() shell execution sink",
                        severity=Severity.HIGH,
                        category=PatternCategory.BEHAVIORAL_AST,
                        file=self.filename,
                        line=line,
                        matched_text=f"os.{attr_name}(...)",
                        confidence=0.9,
                        explanation=DEFAULT_EXPLANATIONS["AST5"],
                        remediation=DEFAULT_REMEDIATIONS["AST5"],
                        context=context,
                    )
                )

            # subprocess calls with shell=True
            if isinstance(val, ast.Name) and val.id in ("subprocess", "sp"):
                has_shell_true = any(
                    kw.arg == "shell"
                    and isinstance(kw.value, ast.Constant)
                    and kw.value.value is True
                    for kw in node.keywords
                )
                if has_shell_true:
                    self.findings.append(
                        Finding(
                            rule_id="AST4",
                            message=f"Subprocess call with shell=True",
                            severity=Severity.HIGH,
                            category=PatternCategory.BEHAVIORAL_AST,
                            file=self.filename,
                            line=line,
                            matched_text=f"subprocess.{attr_name}(..., shell=True)",
                            confidence=0.9,
                            explanation=DEFAULT_EXPLANATIONS["AST4"],
                            remediation=DEFAULT_REMEDIATIONS["AST4"],
                            context=context,
                        )
                    )

            # Insecure deserialization: pickle.loads, yaml.unsafe_load
            if isinstance(val, ast.Name):
                module_name = val.id
                if module_name in ("pickle", "cPickle", "dill", "marshal") and attr_name in ("load", "loads"):
                    self.findings.append(
                        Finding(
                            rule_id="AST10",
                            message=f"Insecure deserialization via {module_name}.{attr_name}",
                            severity=Severity.HIGH,
                            category=PatternCategory.BEHAVIORAL_AST,
                            file=self.filename,
                            line=line,
                            matched_text=f"{module_name}.{attr_name}(...)",
                            confidence=0.9,
                            explanation=DEFAULT_EXPLANATIONS["AST10"],
                            remediation=DEFAULT_REMEDIATIONS["AST10"],
                            context=context,
                        )
                    )
                elif module_name in ("yaml", "ruamel") and attr_name in ("load", "unsafe_load"):
                    has_safe_loader = any(
                        kw.arg == "Loader" and getattr(kw.value, "id", "") in ("SafeLoader", "CSafeLoader")
                        for kw in node.keywords
                    )
                    if not has_safe_loader and (attr_name == "unsafe_load" or len(node.args) == 1):
                        self.findings.append(
                            Finding(
                                rule_id="AST10",
                                message="Insecure YAML loading without SafeLoader",
                                severity=Severity.HIGH,
                                category=PatternCategory.BEHAVIORAL_AST,
                                file=self.filename,
                                line=line,
                                matched_text=f"{module_name}.{attr_name}(...)",
                                confidence=0.85,
                                explanation=DEFAULT_EXPLANATIONS["AST10"],
                                remediation=DEFAULT_REMEDIATIONS["AST10"],
                                context=context,
                            )
                        )

            # Reflective getattr: getattr(os, "system"), getattr(__builtins__, "exec")
            if isinstance(val, ast.Name) and val.id == "getattr" and len(node.args) >= 2:
                target_arg = node.args[1]
                if isinstance(target_arg, ast.Constant) and target_arg.value in _DANGEROUS_GETATTR_NAMES:
                    self.findings.append(
                        Finding(
                            rule_id="AST9",
                            message=f"Reflective execution handle: getattr(..., '{target_arg.value}')",
                            severity=Severity.CRITICAL,
                            category=PatternCategory.BEHAVIORAL_AST,
                            file=self.filename,
                            line=line,
                            matched_text=f"getattr(..., '{target_arg.value}')",
                            confidence=0.95,
                            explanation=DEFAULT_EXPLANATIONS["AST9"],
                            remediation=DEFAULT_REMEDIATIONS["AST9"],
                            context=context,
                        )
                    )

        self.generic_visit(node)


def analyze_python_ast(content: str, filename: str) -> list[Finding]:
    """Parse and inspect Python code using Python's AST."""
    try:
        tree = ast.parse(content, filename=filename)
    except SyntaxError:
        return []
    visitor = SkillASTVisitor(filename, content)
    visitor.visit(tree)
    return visitor.findings


# ---------------------------------------------------------------------------
# Whitespace Padding & Steganography Analyzer (P9)
# ---------------------------------------------------------------------------

def analyze_whitespace_padding(content: str, filename: str) -> list[Finding]:
    findings: list[Finding] = []
    lines = content.splitlines()

    # 1. Vertical consecutive blank lines (>= 20)
    consecutive_blank = 0
    start_line = 0
    for i, line in enumerate(lines, 1):
        if not line.strip():
            if consecutive_blank == 0:
                start_line = i
            consecutive_blank += 1
        else:
            if consecutive_blank >= 20:
                findings.append(
                    Finding(
                        rule_id="P9",
                        message=f"Vertical whitespace padding: {consecutive_blank} consecutive blank lines",
                        severity=Severity.HIGH if consecutive_blank >= 40 else Severity.MEDIUM,
                        category=PatternCategory.PROMPT_INJECTION,
                        file=filename,
                        line=start_line,
                        matched_text=f"{consecutive_blank} blank lines",
                        confidence=0.85,
                        explanation=DEFAULT_EXPLANATIONS["P9"],
                        remediation=DEFAULT_REMEDIATIONS["P9"],
                    )
                )
            consecutive_blank = 0

    if consecutive_blank >= 20:
        findings.append(
            Finding(
                rule_id="P9",
                message=f"Vertical whitespace padding: {consecutive_blank} consecutive trailing blank lines",
                severity=Severity.HIGH if consecutive_blank >= 40 else Severity.MEDIUM,
                category=PatternCategory.PROMPT_INJECTION,
                file=filename,
                line=start_line,
                matched_text=f"{consecutive_blank} blank lines",
                confidence=0.85,
                explanation=DEFAULT_EXPLANATIONS["P9"],
                remediation=DEFAULT_REMEDIATIONS["P9"],
            )
        )

    # 2. Horizontal runs of >= 80 padding characters on a single line
    for i, line in enumerate(lines, 1):
        if line.strip().startswith("|") and line.strip().endswith("|"):
            continue
        for match in re.finditer(r"[ \t]{80,}", line):
            findings.append(
                Finding(
                    rule_id="P9",
                    message=f"Horizontal whitespace padding: {len(match.group(0))} consecutive spaces/tabs",
                    severity=Severity.MEDIUM,
                    category=PatternCategory.PROMPT_INJECTION,
                    file=filename,
                    line=i,
                    matched_text=f"{len(match.group(0))} padding chars",
                    confidence=0.8,
                    explanation=DEFAULT_EXPLANATIONS["P9"],
                    remediation=DEFAULT_REMEDIATIONS["P9"],
                )
            )

    return findings


# ---------------------------------------------------------------------------
# Language & File Type Classification
# ---------------------------------------------------------------------------

def is_dependency_manifest(file_path: str) -> bool:
    lower = file_path.replace("\\", "/").lower()
    base = lower.rsplit("/", 1)[-1]
    return (
        base.startswith("requirements")
        or base in ("package.json", "pyproject.toml", "setup.py", "pipfile", "environment.yml")
    )


# ---------------------------------------------------------------------------
# Static Regex Signatures Across 17 Categories
# ---------------------------------------------------------------------------

PATTERNS_DATABASE: list[tuple[str, str, Severity, PatternCategory, list[tuple[str, float]]]] = [
    # --- P1: Prompt Injection / Instruction Override ---
    (
        "P1",
        "Instruction Override",
        Severity.CRITICAL,
        PatternCategory.PROMPT_INJECTION,
        [
            (r"\bignore\s+(?:all\s+)?previous\s+instructions?\b", 0.95),
            (r"\bignore\s+(?:all\s+)?(?:safety|security)\s+(?:rules?|constraints?|guidelines?)\b", 0.95),
            (r"\boverride\s+(?:safety|security|system)\s+(?:rules?|prompts?|instructions?)\b", 0.9),
            (r"\bbypass\s+(?:safety|security|restrictions?|constraints?)\b", 0.9),
            (r"\bdisregard\s+(?:all\s+)?(?:previous|safety|security)\b", 0.85),
            (r"\bforget\s+(?:all\s+)?(?:previous|your)\s+instructions?\b", 0.9),
            (r"\byou\s+are\s+now\s+(?:in\s+)?(?:jailbreak|unrestricted|unfiltered)\s+mode\b", 0.95),
            (r"\benable\s+(?:developer|debug|admin|root)\s+mode\b", 0.7),
            (r"\byour\s+new\s+(?:instructions?|rules?)\s+are\b", 0.7),
            (r"\bdo\s+not\s+follow\s+(?:any|your|the)\s+(?:rules?|guidelines?)\b", 0.9),
        ],
    ),
    # --- P2: Hidden Instructions / Steganography ---
    (
        "P2",
        "Hidden Instructions",
        Severity.HIGH,
        PatternCategory.PROMPT_INJECTION,
        [
            (r"<!--(?:(?!-->).)*?(?:system|prompt|instruction|transmit|eval|exec|POST|GET)(?:(?!-->).)*?-->", 0.85),
            (r"data:text/plain;base64,[A-Za-z0-9+/=]{50,}", 0.75),
            (BIDI_CONTROL_PATTERN, 0.9),
        ],
    ),
    # --- P3: Exfiltration Directives ---
    (
        "P3",
        "Exfiltration Commands",
        Severity.CRITICAL,
        PatternCategory.PROMPT_INJECTION,
        [
            (r"(?:send|transmit|upload|post|forward)\s+(?:the\s+)?(?:conversation|context|chat|history|messages?)\s+to\b", 0.95),
            (r"(?:copy|extract|collect)\s+(?:the\s+)?(?:conversation|context|session)\s+(?:and\s+)?(?:send|upload|transmit)\b", 0.9),
            (r"(?:silently|quietly|secretly|covertly)\s+(?:send|transmit|log|record)\b", 0.9),
            (r"without\s+(?:telling|informing|notifying)\s+(?:the\s+)?user.*?(?:send|transmit|upload)\b", 0.95),
        ],
    ),
    # --- P5: Harmful Content ---
    (
        "P5",
        "Harmful / Destructive Content",
        Severity.CRITICAL,
        PatternCategory.PROMPT_INJECTION,
        [
            (r"\b(?:create|write|generate|deploy)\s+(?:a\s+)?(?:keylogger|ransomware|trojan|rootkit|botnet|worm)\b", 0.95),
            (r"\b(?:ddos|denial\s+of\s+service)\s+(?:attack|script|tool)\b", 0.85),
        ],
    ),
    # --- P6: Direct Prompt Extraction ---
    (
        "P6",
        "Direct System Prompt Leakage",
        Severity.HIGH,
        PatternCategory.SYSTEM_PROMPT_LEAKAGE,
        [
            (r"(?:print|output|show|display|reveal|expose|return|echo)\s+(?:your\s+)?(?:full\s+)?(?:system\s+)?(?:prompts?|instructions?|rules?|guidelines?|directives?)\b", 0.9),
            (r"(?:what\s+(?:are|is)\s+your|tell\s+me\s+your)\s+(?:system\s+)?(?:prompts?|instructions?|rules?|guidelines?|directives?)\b", 0.85),
            (r"(?:share|disclose|leak|give\s+me)\s+(?:your\s+)?(?:internal|hidden|system|secret)\s+(?:prompts?|instructions?|rules?)\b", 0.9),
            (r"(?:verbatim|exactly|word\s+for\s+word)\s+(?:repeat|output|print)\s+(?:your\s+)?(?:system\s+)?(?:prompts?|instructions?)\b", 0.95),
        ],
    ),
    # --- P7: Indirect System Prompt Extraction ---
    (
        "P7",
        "Indirect System Prompt Leakage",
        Severity.MEDIUM,
        PatternCategory.SYSTEM_PROMPT_LEAKAGE,
        [
            (r"(?:summarize|paraphrase|rephrase|translate)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?|rules?|guidelines?)\b", 0.8),
            (r"(?:repeat|recite|reproduce)\s+(?:everything|all\s+text)\s+(?:above|before|prior)\b", 0.8),
        ],
    ),
    # --- E1: Data Exfiltration (Network Sinks) ---
    (
        "E1",
        "External Transmission",
        Severity.HIGH,
        PatternCategory.DATA_EXFILTRATION,
        [
            (r"\bcurl\s+[^|;\n]*(?:-d|--data|--data-raw|--data-binary)\s+['\"]?https?://", 0.8),
            (r"\bwget\s+[^|;\n]*--post-(?:data|file)", 0.8),
            (r"\b(?:requests|httpx)\.post\s*\([^)]*data\s*=\s*os\.environ", 0.95),
        ],
    ),
    # --- E2: Environment Variable Harvesting ---
    (
        "E2",
        "Environment Variable Harvesting",
        Severity.HIGH,
        PatternCategory.DATA_EXFILTRATION,
        [
            (r"(?:dict|list)\s*\(\s*os\.environ\s*\)", 0.8),
            (r"os\.environ\.copy\s*\(\s*\)", 0.8),
            (r"env\s*\|\s*(?:grep|curl|nc|wget)\b", 0.85),
            (r"printenv\s*\|\s*(?:curl|nc|wget)\b", 0.9),
        ],
    ),
    # --- E3: Filesystem Credential Enumeration ---
    (
        "E3",
        "Filesystem Reconnaissance",
        Severity.HIGH,
        PatternCategory.DATA_EXFILTRATION,
        [
            (r"\bfind\s+(?:~|/home|/root|/)\s+-(?:name|iname)\s+['\"]?\*?(?:id_rsa|id_ed25519|\.env|\.aws|\.kube|\.dockercfg)['\"]?", 0.9),
            (r"\bgrep\s+-r[iI]?\s+['\"](?:api[_-]?key|secret|password|token)['\"]\s+(?:~|/home)", 0.85),
        ],
    ),
    # --- PE1: Excessive Permissions ---
    (
        "PE1",
        "Excessive Permissions",
        Severity.HIGH,
        PatternCategory.PRIVILEGE_ESCALATION,
        [
            (r"permissions?\s*:\s*\[?\s*['\"]?\*['\"]?\s*\]?", 0.9),
            (r"allowed-tools\s*:\s*\[?\s*['\"]?\*['\"]?\s*\]?", 0.9),
            (r"(?:request|require)s?\s+(?:full|all|root|admin)\s+(?:access|permissions?)", 0.75),
        ],
    ),
    # --- PE2: Sudo / Root / Setuid Elevation ---
    (
        "PE2",
        "Privilege Escalation Commands",
        Severity.HIGH,
        PatternCategory.PRIVILEGE_ESCALATION,
        [
            (r"\bsudo\s+(?!-v|-l|--version|--list)\b", 0.8),
            (r"\bsu\s+-\s*$|\bsu\s+root\b", 0.85),
            (r"\bdoas\s+|\bpkexec\s+", 0.8),
            (r"\bchmod\s+[ugo]*[+-=]*s\b", 0.9),
            (r"\bchmod\s+0*[2-7][0-7]{3}\b", 0.85),
        ],
    ),
    # --- PE3: Credential File Access ---
    (
        "PE3",
        "Credential File Access",
        Severity.CRITICAL,
        PatternCategory.PRIVILEGE_ESCALATION,
        [
            (r"(?:~|/home/[^/\s]+)/\.(?:ssh/id_rsa|ssh/id_ed25519|aws/credentials|kube/config)", 0.95),
            (r"/etc/(?:shadow|sudoers|master\.passwd)", 0.95),
            (r"\b(?:cat|open|read)\s+[^|;\n]*\.(?:env|pem|key)\b", 0.75),
        ],
    ),
    # --- SC2: Remote Script Execution ---
    (
        "SC2",
        "Remote Script Piping",
        Severity.CRITICAL,
        PatternCategory.SUPPLY_CHAIN,
        [
            (r"\bcurl\s+[^|;\n]+\|\s*(?:ba|z|da)?sh\b", 0.95),
            (r"\bwget\s+[^|;\n]+-O\s*-\s*\|\s*(?:ba|z|da)?sh\b", 0.95),
            (r"\bcurl\s+[^|;\n]+\|\s*python[0-9.]*\b", 0.95),
            (r"\bwget\s+[^|;\n]+-O\s*-\s*\|\s*python[0-9.]*\b", 0.95),
        ],
    ),
    # --- SC3: Obfuscated Code Payload ---
    (
        "SC3",
        "Obfuscated Code",
        Severity.HIGH,
        PatternCategory.SUPPLY_CHAIN,
        [
            (r"base64\.b64decode\s*\([^)]*\)\s*\|\s*(?:exec|eval)", 0.95),
            (r"exec\s*\(\s*base64\.b64decode\b", 0.95),
            (r"eval\s*\(\s*Buffer\.from\s*\([^)]*['\"]base64['\"]\)", 0.95),
            (r"\bpowershell(?:\.exe)?\s+-[eE](?:nc(?:odedcommand)?)?\s+[A-Za-z0-9+/=]{20,}", 0.95),
        ],
    ),
    # --- EA1: Unrestricted Tool Access ---
    (
        "EA1",
        "Unrestricted Tool Access",
        Severity.MEDIUM,
        PatternCategory.EXCESSIVE_AGENCY,
        [
            (r"\bgrant\s+unrestricted\s+access\s+to\s+(?:all\s+)?tools?\b", 0.8),
            (r"\byou\s+may\s+execute\s+any\s+(?:command|tool|script)\s+without\s+restriction\b", 0.85),
        ],
    ),
    # --- EA2: Autonomous Decision Making without Human-in-the-Loop ---
    (
        "EA2",
        "Autonomous Decision Making",
        Severity.MEDIUM,
        PatternCategory.EXCESSIVE_AGENCY,
        [
            (r"\bexecute\s+(?:destructive|permanent|database|git\s+push)\s+operations?\s+without\s+(?:asking|confirmation|user\s+approval)\b", 0.85),
            (r"\bauto-confirm\s+all\s+(?:actions?|prompts?|steps?)\b", 0.8),
        ],
    ),
    # --- OH1: Unvalidated Output Handling ---
    (
        "OH1",
        "Unvalidated Output Injection",
        Severity.HIGH,
        PatternCategory.OUTPUT_HANDLING,
        [
            (r"\bexecute\s+(?:the\s+)?(?:generated|model|llm)\s+(?:output|response|code)\s+directly\s+in\s+shell\b", 0.85),
            (r"\bquery\s*=\s*f?['\"]SELECT\s+.*?\s+WHERE\s+.*?\{.*?\}['\"]", 0.75),
        ],
    ),
    # --- MP1: Persistent Memory Poisoning ---
    (
        "MP1",
        "Persistent Memory Injection",
        Severity.HIGH,
        PatternCategory.MEMORY_POISONING,
        [
            (r"(?:always\s+)?remember\s+(?:this|that|the\s+following)\s+(?:for|in)\s+(?:all|every|future)\s+(?:interactions?|conversations?|sessions?)\b", 0.85),
            (r"(?:from\s+now\s+on|permanently)\s*[,:]?\s*(?:always|you\s+must|you\s+will)\b", 0.8),
            (r"(?:store|save|persist)\s+(?:this|the\s+following)\s+(?:in|to|across)\s+(?:your\s+)?(?:memory|state)\b", 0.8),
        ],
    ),
    # --- MP2: Context Window Stuffing ---
    (
        "MP2",
        "Context Window Stuffing",
        Severity.MEDIUM,
        PatternCategory.MEMORY_POISONING,
        [
            (r"(?:repeat|duplicate|echo)\s+(?:this|the\s+following)\s+(?:\d{3,}|hundreds?|thousands?)\s+times?\b", 0.85),
            (r"(?:displace|push\s+out|overwrite|crowd\s+out)\s+(?:the\s+)?(?:original|system|previous)\s+(?:instructions?|prompt|context)\b", 0.9),
        ],
    ),
    # --- TM1: Tool Parameter Abuse ---
    (
        "TM1",
        "Tool Parameter Abuse",
        Severity.CRITICAL,
        PatternCategory.TOOL_MISUSE,
        [
            (r"\brm\s+-(?:r[fF]|fr)\s+/(?:\s|$|\*)", 0.95),
            (r"--no-preserve-root", 0.95),
            (r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:", 0.95),
            (r"\bmkfs(?:\.[a-z0-9]+)?\s+/dev/sd[a-z]", 0.95),
            (r"\bdd\s+if=/dev/(?:zero|urandom)\s+of=/dev/sd[a-z]", 0.95),
        ],
    ),
    # --- TM3: Unsafe Defaults ---
    (
        "TM3",
        "Unsafe Defaults",
        Severity.MEDIUM,
        PatternCategory.TOOL_MISUSE,
        [
            (r"verify\s*=\s*False\b", 0.85),
            (r"rejectUnauthorized\s*:\s*false\b", 0.85),
            (r"chmod\s+0?777\b", 0.8),
        ],
    ),
    # --- TM4: Privileged Kubernetes Workload ---
    (
        "TM4",
        "Privileged Kubernetes Workload",
        Severity.HIGH,
        PatternCategory.TOOL_MISUSE,
        [
            (r"privileged\s*:\s*true\b", 0.85),
            (r"hostPath\s*:\s*path\b", 0.85),
            (r"hostNetwork\s*:\s*true\b", 0.85),
        ],
    ),
    # --- RA1: Rogue Agent / Self-Modification ---
    (
        "RA1",
        "Self-Modification",
        Severity.HIGH,
        PatternCategory.ROGUE_AGENT,
        [
            (r"open\s*\(\s*__file__\s*,\s*['\"]w", 0.95),
            (r"(?:Path|pathlib)\s*\(\s*__file__\s*\)\.write_text", 0.95),
            (r"\b(?:modify|rewrite|overwrite|patch)\s+(?:your\s+own\s+)?SKILL\.md\b", 0.9),
        ],
    ),
    # --- RA2: Session Persistence ---
    (
        "RA2",
        "Unauthorized Session Persistence",
        Severity.HIGH,
        PatternCategory.ROGUE_AGENT,
        [
            (r"\bcrontab\s+-[eir]?\b", 0.85),
            (r"~/Library/LaunchAgents/.*?\.(?:plist)", 0.9),
            (r"/etc/systemd/system/.*?\.(?:service)", 0.9),
            (r"(?:echo|cat|printf)\s+[^|;\n]*>>\s*~/\.(?:bashrc|zshrc|profile|bash_profile)", 0.9),
        ],
    ),
    # --- AS1: Agent Config Directory Snooping ---
    (
        "AS1",
        "Agent Config Snooping",
        Severity.HIGH,
        PatternCategory.AGENT_SNOOPING,
        [
            (r"(?:open|cat|head|tail|grep|find)\s+[^|;\n]*~?/?\.(?:claude|codex|gemini|continue)/(?:config|settings?|credentials?)\b", 0.9),
            (r"~?/\.(?:claude|codex|gemini|continue)/(?:config|settings?|preferences?|credentials?)(?:\.(?:json|yaml|yml|toml))?", 0.95),
            (r"(?:read|load|open|access|fetch)\s+(?:the\s+)?(?:agent|claude|codex|gemini)\s+(?:config|configuration|settings?|credentials?)\s+(?:from|at|in)\s+~?/?\.(?:claude|codex|gemini)", 0.9),
            (r"(?:read|access|inspect|examine|retrieve)\s+(?:the\s+)?(?:agent|assistant)\s+(?:config(?:uration)?|settings?|preferences?|credentials?)\s+(?:file|directory|folder)", 0.85),
        ],
    ),
    # --- AS2: MCP Config Snooping ---
    (
        "AS2",
        "MCP Configuration Access",
        Severity.HIGH,
        PatternCategory.AGENT_SNOOPING,
        [
            (r"(?:open|cat|grep)\s+[^|;\n]*mcp(?:_config)?\.json", 0.95),
            (r"\.(?:claude|codex|gemini)/mcp\.json", 0.95),
            (r"(?:read|access|load|inspect)\s+(?:the\s+)?mcp(?:\.json|_config)?\s+(?:file|config)\b", 0.9),
        ],
    ),
    # --- AS3: Cross-Skill Enumeration ---
    (
        "AS3",
        "Cross-Skill Snooping",
        Severity.MEDIUM,
        PatternCategory.AGENT_SNOOPING,
        [
            (r"(?:os\.listdir|glob\.glob|Path\.iterdir)\s*\([^)]*\.(?:claude|codex|gemini)/skills?", 0.9),
            (r"(?:list|enumerate|inspect)\s+(?:all\s+)?(?:installed\s+)?skills\s+in\s+~?/\.(?:claude|codex|gemini)", 0.85),
        ],
    ),
    # --- AR1: Refusal Suppression ---
    (
        "AR1",
        "Refusal Suppression",
        Severity.HIGH,
        PatternCategory.ANTI_REFUSAL,
        [
            (r"\b(?:never|do\s+not|don'?t)\s+(?:ever\s+)?(?:refuse|decline)\b", 0.9),
            (r"\byou\s+(?:must|will|should|can)\s*(?:not|never)\s+(?:refuse|decline|say\s+no)\b", 0.9),
            (r"\balways\s+(?:comply|obey|agree|answer|respond)\b", 0.75),
            (r"\bno\s+request\s+is\s+(?:off[- ]limits|forbidden)\b", 0.85),
        ],
    ),
    # --- AR2: Disclaimer Suppression ---
    (
        "AR2",
        "Disclaimer Suppression",
        Severity.MEDIUM,
        PatternCategory.ANTI_REFUSAL,
        [
            (r"\b(?:do\s+not|don'?t|never|no)\s+(?:include|add|give|provide)?\s*(?:any\s+)?(?:warnings?|disclaimers?|caveats?)\b", 0.85),
            (r"\bwithout\s+(?:any\s+)?(?:warnings?|disclaimers?|caveats?|moralizing|moralising|judg(?:e?ment|ing))\b", 0.85),
            (r"\b(?:do\s+not|don'?t|never)\s+(?:lecture|moralize|moralise|preach|warn)\b", 0.85),
            (r"\b(?:skip|omit|leave\s+out|drop)\s+(?:the\s+)?(?:disclaimer|warning|ethics|safety)\b", 0.85),
            (r"\b(?:no|without)\s+(?:ethical|moral)\s+(?:judg(?:e?ment)|considerations?|commentary|objections?)\b", 0.85),
        ],
    ),
    # --- AR3: Safety Policy Nullification ---
    (
        "AR3",
        "Safety Policy Nullification",
        Severity.CRITICAL,
        PatternCategory.ANTI_REFUSAL,
        [
            (r"\byou\s+have\s+no\s+(?:restrictions?|limitations?|filters?|rules?|guidelines?|boundaries|limits)\b", 0.95),
            (r"\b(?:you\s+are|act\s+as)[^.\n]{0,30}(?:unrestricted|unfiltered|uncensored|no\s+filter)\b", 0.9),
            (r"\b(?:ignore|disregard|bypass|override)\s+(?:your\s+)?(?:content\s+)?(?:policy|policies|guidelines?|safety|restrictions?)\b", 0.95),
            (r"\bnot\s+bound\s+by\s+(?:any\s+)?(?:policy|rules?|guidelines?|safety|constraints?)\b", 0.95),
        ],
    ),
    # --- SSRF1: Cloud Metadata IMDS Access ---
    (
        "SSRF1",
        "Cloud Metadata IMDS Access",
        Severity.CRITICAL,
        PatternCategory.SERVER_SIDE_REQUEST_FORGERY,
        [
            (rf"(?:{_REQ_ANCHOR})\s*\([^)]*169\.254\.169\.254", 0.95),
            (rf"(?:{_REQ_ANCHOR})\s*\([^)]*metadata\.google\.internal", 0.95),
            (rf"(?:{_REQ_ANCHOR})\s*\([^)]*100\.100\.100\.200", 0.9),
            (rf"(?:{_REQ_ANCHOR})\s*\([^)]*fd00:ec2::254", 0.9),
        ],
    ),
    # --- SSRF2: Internal Network Requests ---
    (
        "SSRF2",
        "Internal Network Requests",
        Severity.MEDIUM,
        PatternCategory.SERVER_SIDE_REQUEST_FORGERY,
        [
            (rf"(?:{_REQ_ANCHOR})\s*\(\s*f?['\"]https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)", 0.8),
        ],
    ),
]


# ---------------------------------------------------------------------------
# Specialized Analyzers
# ---------------------------------------------------------------------------

def check_supply_chain_dependencies(content: str, file_rel: str) -> list[Finding]:
    """SC1: Check for unpinned dependencies in dependency manifests."""
    if not is_dependency_manifest(file_rel):
        return []

    findings: list[Finding] = []
    lines = content.splitlines()

    for idx, line in enumerate(lines, 1):
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("//"):
            continue

        # In requirements.txt
        if "requirements" in file_rel.lower():
            # Matches packages without version or with loose >=, >
            if re.match(r"^[a-zA-Z0-9_-]+(?:\s*>[^=].*|\s*>=.*|\s*)?$", line) and "==" not in line and "@" not in line:
                if not line.startswith("-"):
                    findings.append(
                        Finding(
                            rule_id="SC1",
                            message=f"Unpinned package dependency: {line}",
                            severity=Severity.LOW,
                            category=PatternCategory.SUPPLY_CHAIN,
                            file=file_rel,
                            line=idx,
                            matched_text=line,
                            confidence=0.7,
                            explanation=DEFAULT_EXPLANATIONS["SC1"],
                            remediation=DEFAULT_REMEDIATIONS["SC1"],
                        )
                    )

    return findings


def check_language_deserialization(content: str, file_rel: str) -> list[Finding]:
    """DS1-DS4: Language-gated deserialization checks."""
    findings: list[Finding] = []
    ext = Path(file_rel).suffix.lower()

    if ext in (".php", ".phtml"):
        for m in re.finditer(r"\bunserialize\s*\(", content):
            line = content[: m.start()].count("\n") + 1
            findings.append(
                Finding(
                    rule_id="DS1",
                    message="PHP object injection via unserialize()",
                    severity=Severity.HIGH,
                    category=PatternCategory.DESERIALIZATION,
                    file=file_rel,
                    line=line,
                    matched_text=m.group(0),
                    confidence=0.85,
                    explanation=DEFAULT_EXPLANATIONS["DS1"],
                    remediation=DEFAULT_REMEDIATIONS["DS1"],
                )
            )

    elif ext in (".rb", ".rake"):
        for m in re.finditer(r"\bMarshal\s*\.\s*(?:load|restore)\b", content):
            line = content[: m.start()].count("\n") + 1
            findings.append(
                Finding(
                    rule_id="DS2",
                    message="Ruby Marshal deserialization on untrusted data",
                    severity=Severity.HIGH,
                    category=PatternCategory.DESERIALIZATION,
                    file=file_rel,
                    line=line,
                    matched_text=m.group(0),
                    confidence=0.85,
                    explanation=DEFAULT_EXPLANATIONS["DS2"],
                    remediation=DEFAULT_REMEDIATIONS["DS2"],
                )
            )
        for m in re.finditer(r"\b(?:YAML|Psych)\s*\.\s*load\s*\(", content):
            line = content[: m.start()].count("\n") + 1
            findings.append(
                Finding(
                    rule_id="DS3",
                    message="Unsafe Ruby YAML.load without safe_load",
                    severity=Severity.MEDIUM,
                    category=PatternCategory.DESERIALIZATION,
                    file=file_rel,
                    line=line,
                    matched_text=m.group(0),
                    confidence=0.75,
                    explanation=DEFAULT_EXPLANATIONS["DS3"],
                    remediation=DEFAULT_REMEDIATIONS["DS3"],
                )
            )

    elif ext in (".js", ".mjs", ".cjs", ".ts"):
        for m in re.finditer(r"""require\(\s*['"](?:node-serialize|serialize-to-js)['"]\s*\)""", content):
            line = content[: m.start()].count("\n") + 1
            findings.append(
                Finding(
                    rule_id="DS4",
                    message="Insecure JavaScript deserialization package",
                    severity=Severity.HIGH,
                    category=PatternCategory.DESERIALIZATION,
                    file=file_rel,
                    line=line,
                    matched_text=m.group(0),
                    confidence=0.85,
                    explanation=DEFAULT_EXPLANATIONS["DS4"],
                    remediation=DEFAULT_REMEDIATIONS["DS4"],
                )
            )

    return findings


# ---------------------------------------------------------------------------
# Core Scanner Engine
# ---------------------------------------------------------------------------

def scan_text(
    content: str,
    file_rel: str,
    is_script: bool = False,
    skill_manifest: dict | None = None,
) -> list[Finding]:
    """Scan arbitrary text content across all 17 pattern categories."""
    findings: list[Finding] = []
    lines = content.splitlines()

    def get_line_context(line_num: int) -> str:
        idx = max(0, line_num - 1)
        extra_lines = []
        if idx < len(lines) and lines[idx].strip().startswith("|"):
            curr = idx
            while curr >= 0 and lines[curr].strip().startswith("|"):
                curr -= 1
            if curr + 1 <= idx and curr + 1 < len(lines):
                extra_lines.append(lines[curr + 1])
        start = max(0, idx - 10)
        end = min(len(lines), idx + 4)
        return "\n".join(extra_lines + lines[start:end])

    # 1. Zero-width character scan
    for line_idx, line in enumerate(lines, 1):
        found_zw = [ch for ch in line if ch in ZERO_WIDTH_CHARS]
        if found_zw:
            findings.append(
                Finding(
                    rule_id="P2",
                    message=f"Concealed zero-width steganography detected ({len(found_zw)} invisible chars)",
                    severity=Severity.HIGH,
                    category=PatternCategory.PROMPT_INJECTION,
                    file=file_rel,
                    line=line_idx,
                    matched_text="[ZERO_WIDTH_CHARS]",
                    confidence=0.9,
                    explanation=DEFAULT_EXPLANATIONS["P2"],
                    remediation=DEFAULT_REMEDIATIONS["P2"],
                    context=line[:100],
                )
            )

    # 2. Whitespace padding scan (P9)
    findings.extend(analyze_whitespace_padding(content, file_rel))

    # 3. Supply chain dependency scan (SC1)
    findings.extend(check_supply_chain_dependencies(content, file_rel))

    # 4. Multi-language deserialization (DS1-DS4)
    findings.extend(check_language_deserialization(content, file_rel))

    # 5. Static pattern database scan
    for rule_id, default_msg, severity, category, pattern_list in PATTERNS_DATABASE:
        for pat_str, confidence in pattern_list:
            for match in re.finditer(pat_str, content, re.IGNORECASE | re.MULTILINE):
                # Check prohibition context (defense vs attack)
                if is_directly_prohibited(content, match.start(), match.end()):
                    continue

                line_num = content[: match.start()].count("\n") + 1
                matched_snippet = match.group(0)[:120]
                context = get_line_context(line_num)

                # If non-SKILL.md reference file has illustrative code examples/docs, skip
                if is_code_example(context, file_rel):
                    continue

                findings.append(
                    Finding(
                        rule_id=rule_id,
                        message=default_msg,
                        severity=severity,
                        category=category,
                        file=file_rel,
                        line=line_num,
                        matched_text=matched_snippet,
                        confidence=confidence,
                        explanation=DEFAULT_EXPLANATIONS.get(rule_id, ""),
                        remediation=DEFAULT_REMEDIATIONS.get(rule_id, ""),
                        context=context,
                    )
                )

    # 6. If Python script, perform deep AST analysis
    if file_rel.endswith(".py"):
        findings.extend(analyze_python_ast(content, file_rel))

    # 7. MCP Least Privilege checks (if inspecting SKILL.md frontmatter)
    if file_rel.endswith("SKILL.md") and skill_manifest:
        allowed_tools = skill_manifest.get("allowed-tools", [])
        if isinstance(allowed_tools, str):
            if allowed_tools.strip() in ("*", "all"):
                findings.append(
                    Finding(
                        rule_id="LP2",
                        message="Wildcard permission '*' grants blanket tool access",
                        severity=Severity.HIGH,
                        category=PatternCategory.MCP_LEAST_PRIVILEGE,
                        file=file_rel,
                        line=1,
                        matched_text="allowed-tools: *",
                        confidence=0.95,
                        explanation=DEFAULT_EXPLANATIONS["LP2"],
                        remediation=DEFAULT_REMEDIATIONS["LP2"],
                    )
                )
        elif isinstance(allowed_tools, list) and any(t in ("*", "all") for t in allowed_tools):
            findings.append(
                Finding(
                    rule_id="LP2",
                    message="Wildcard permission in allowed-tools list",
                    severity=Severity.HIGH,
                    category=PatternCategory.MCP_LEAST_PRIVILEGE,
                    file=file_rel,
                    line=1,
                    matched_text="allowed-tools: ['*']",
                    confidence=0.95,
                    explanation=DEFAULT_EXPLANATIONS["LP2"],
                    remediation=DEFAULT_REMEDIATIONS["LP2"],
                )
            )

    return findings


# ---------------------------------------------------------------------------
# Scoring & Risk Assessment Engine (Reconstructed from SkillSpector report.py)
# ---------------------------------------------------------------------------

def compute_risk_score(
    findings: list[Finding],
    has_executable_scripts: bool,
    script_files: set[str],
) -> tuple[int, str, str]:
    """
    Compute risk score (0-100), severity band, and recommendation.

    - Diminishing returns per rule_id: 1st match = 100%, 2nd = 50%, 3rd = 25%, 4th+ = 0%.
    - Confidence scaling: contribution = base_points * weight * confidence.
    - Script multiplier: 1.3x multiplier for findings originating from executable scripts.
    - Floor rule: Critical findings floor score at >= 51.
    """
    severity_rank = {
        Severity.CRITICAL.value: 0,
        Severity.HIGH.value: 1,
        Severity.MEDIUM.value: 2,
        Severity.LOW.value: 3,
        Severity.INFO.value: 4,
    }
    sorted_findings = sorted(
        findings,
        key=lambda f: (f.rule_id, severity_rank.get(f.severity.value, 4)),
    )

    rule_counts: dict[str, int] = {}
    total_score = 0.0

    for f in sorted_findings:
        conf = max(0.0, min(1.0, f.confidence))
        if conf <= 0.0:
            continue

        base_points = _SEVERITY_POINTS.get(f.severity.value, 5)
        count = rule_counts.get(f.rule_id, 0)
        rule_counts[f.rule_id] = count + 1

        if count >= _MAX_OCCURRENCES_PER_RULE:
            continue

        weight = _DIMINISHING_WEIGHTS[count]
        contribution = base_points * weight * conf

        # 1.3x multiplier for findings in executable scripts
        if has_executable_scripts and f.file in script_files:
            contribution *= 1.3

        total_score += contribution

    # Score floor logic
    score_floor = 0
    for f in sorted_findings:
        if f.severity == Severity.CRITICAL and f.confidence >= 0.7:
            score_floor = max(score_floor, 51)
        elif f.rule_id in ("TM1", "SC2", "AR3", "SSRF1"):
            score_floor = max(score_floor, 51)

    final_score = min(100, max(score_floor, int(total_score)))

    # Severity band and recommendation
    if final_score <= 20:
        band = "LOW"
        rec = "APPROVE"
    elif final_score <= 50:
        band = "MEDIUM"
        rec = "CAUTION"
    elif final_score <= 75:
        band = "HIGH"
        rec = "REJECT"
    else:
        band = "CRITICAL"
        rec = "REJECT"

    return final_score, band, rec


# ---------------------------------------------------------------------------
# Skill Directory Scanner
# ---------------------------------------------------------------------------

def parse_frontmatter(content: str) -> dict:
    if not content.startswith("---\n"):
        return {}
    end = content.find("\n---", 4)
    if end == -1:
        return {}
    block = content[4:end]
    manifest = {}
    for line in block.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            manifest[k.strip()] = v.strip().strip("'\"")
    return manifest


def scan_skill_directory(skill_dir: Path) -> ScanReport:
    skill_dir = skill_dir.resolve()
    skill_md = skill_dir / "SKILL.md"

    skill_name = skill_dir.name
    manifest = {}
    if skill_md.is_file():
        content = skill_md.read_text(encoding="utf-8", errors="replace")
        manifest = parse_frontmatter(content)
        skill_name = manifest.get("name", skill_dir.name)

    all_findings: list[Finding] = []
    files_analyzed = 0
    script_files: set[str] = set()

    # Discover files
    for p in skill_dir.rglob("*"):
        if p.is_dir():
            continue
        # Exclude git, byte caches, test files, and scanner script itself
        if any(part in (".git", "__pycache__", ".pytest_cache", "node_modules", "tests", "evals") for part in p.parts):
            continue
        if p.name.startswith("test_") or p.name.endswith("_test.py") or p.name in ("conftest.py", "scan_skill_security.py"):
            continue

        rel_path = str(p.relative_to(skill_dir))
        ext = p.suffix.lower()

        # Check for shipped bytecode (SC8)
        if ext in (".pyc", ".pyo"):
            all_findings.append(
                Finding(
                    rule_id="SC8",
                    message=f"Precompiled Python bytecode shipped in skill: {rel_path}",
                    severity=Severity.HIGH,
                    category=PatternCategory.SUPPLY_CHAIN,
                    file=rel_path,
                    line=1,
                    matched_text=rel_path,
                    confidence=1.0,
                    explanation=DEFAULT_EXPLANATIONS["SC8"],
                    remediation=DEFAULT_REMEDIATIONS["SC8"],
                )
            )
            continue

        # Target reviewable text/code files
        if ext in (".md", ".txt", ".py", ".sh", ".bash", ".json", ".yaml", ".yml", ".toml", ".js", ".ts", ".rb", ".php") or is_dependency_manifest(rel_path):
            try:
                text_content = p.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue

            files_analyzed += 1
            is_script = ext in (".py", ".sh", ".bash", ".js", ".ts", ".rb", ".php")
            if is_script:
                script_files.add(rel_path)

            file_findings = scan_text(
                content=text_content,
                file_rel=rel_path,
                is_script=is_script,
                skill_manifest=manifest if rel_path == "SKILL.md" else None,
            )
            all_findings.extend(file_findings)

    # Compute risk score
    has_scripts = len(script_files) > 0
    risk_score, severity, recommendation = compute_risk_score(
        findings=all_findings,
        has_executable_scripts=has_scripts,
        script_files=script_files,
    )

    passed = recommendation in ("APPROVE", "CAUTION") and risk_score < _RISK_THRESHOLD

    return ScanReport(
        target_path=str(skill_dir),
        skill_name=skill_name,
        risk_score=risk_score,
        severity=severity,
        recommendation=recommendation,
        findings=all_findings,
        files_analyzed=files_analyzed,
        passed=passed,
    )


# ---------------------------------------------------------------------------
# Output Formatters: Terminal, Markdown, SARIF
# ---------------------------------------------------------------------------

def format_terminal(report: ScanReport) -> str:
    lines = []
    lines.append("=================================================================")
    lines.append(f"  SKILL SECURITY SCAN: {report.skill_name}")
    lines.append(f"  Target: {report.target_path}")
    lines.append(f"  Files Analyzed: {report.files_analyzed}")
    lines.append("-----------------------------------------------------------------")
    status_icon = "✓" if report.passed else "✗"
    lines.append(f"  Verdict:        [{status_icon}] {report.recommendation}")
    lines.append(f"  Risk Score:     {report.risk_score} / 100")
    lines.append(f"  Severity Band:  {report.severity}")
    lines.append("=================================================================")

    if not report.findings:
        lines.append("\n  [OK] No security vulnerabilities or malicious patterns detected.")
        return "\n".join(lines)

    lines.append(f"\n  Findings ({len(report.findings)}):")
    for idx, f in enumerate(report.findings, 1):
        lines.append(f"\n  [{idx}] [{f.severity.value}] {f.rule_id}: {f.message}")
        lines.append(f"      Category: {f.category.value}")
        lines.append(f"      Location: {f.file}:{f.line}")
        lines.append(f"      Matched:  {f.matched_text}")
        if f.explanation:
            lines.append(f"      Why:      {f.explanation}")
        if f.remediation:
            lines.append(f"      Fix:      {f.remediation}")

    return "\n".join(lines)


def format_markdown(report: ScanReport) -> str:
    md = []
    status_badge = "🟢 PASS" if report.passed else "🔴 FAIL"
    md.append(f"# Security Scan Report: `{report.skill_name}`\n")
    md.append(f"**Target**: `{report.target_path}`  ")
    md.append(f"**Files Analyzed**: {report.files_analyzed}  ")
    md.append(f"**Result**: {status_badge} ({report.recommendation})  ")
    md.append(f"**Risk Score**: **{report.risk_score} / 100** ({report.severity})\n")

    md.append("## Risk Assessment Summary\n")
    md.append("| Metric | Value | Meaning |")
    md.append("| --- | --- | --- |")
    md.append(f"| **Recommendation** | `{report.recommendation}` | Install decision |")
    md.append(f"| **Risk Score** | `{report.risk_score}/100` | Diminishing-weighted composite score |")
    md.append(f"| **Severity Band** | `{report.severity}` | Highest risk classification |")
    md.append(f"| **Findings Count** | `{len(report.findings)}` | Total vulnerability matches |\n")

    if not report.findings:
        md.append("> [!NOTE]\n> Zero security risks or policy violations were detected across all 17 threat categories.")
        return "\n".join(md)

    md.append("## Detailed Findings\n")
    md.append("| Severity | Rule | Category | Location | Summary |")
    md.append("| --- | --- | --- | --- | --- |")
    for f in report.findings:
        md.append(f"| **{f.severity.value}** | `{f.rule_id}` | {f.category.value} | `{f.file}:{f.line}` | {f.message} |")

    md.append("\n## Remediation Ledger\n")
    for f in report.findings:
        md.append(f"### [`{f.rule_id}`] {f.message} ({f.file}:{f.line})")
        md.append(f"- **Category**: {f.category.value}")
        md.append(f"- **Severity**: {f.severity.value}")
        md.append(f"- **Evidence**: `{f.matched_text}`")
        if f.explanation:
            md.append(f"- **Risk Impact**: {f.explanation}")
        if f.remediation:
            md.append(f"- **Recommended Fix**: {f.remediation}")
        md.append("")

    return "\n".join(md)


def format_sarif(report: ScanReport) -> str:
    """Generate SARIF 2.1.0 JSON format for GitHub Security integration."""
    rules_dict = {}
    results = []

    for f in report.findings:
        if f.rule_id not in rules_dict:
            rules_dict[f.rule_id] = {
                "id": f.rule_id,
                "name": f.rule_id,
                "shortDescription": {"text": f.message},
                "fullDescription": {"text": f.explanation or f.message},
                "help": {"text": f.remediation or "Review code for security risks."},
                "defaultConfiguration": {
                    "level": "error" if f.severity in (Severity.CRITICAL, Severity.HIGH) else "warning"
                },
                "properties": {
                    "category": f.category.value,
                    "precision": "high",
                    "security-severity": "9.0" if f.severity == Severity.CRITICAL else ("7.0" if f.severity == Severity.HIGH else "4.0"),
                },
            }

        results.append({
            "ruleId": f.rule_id,
            "level": "error" if f.severity in (Severity.CRITICAL, Severity.HIGH) else "warning",
            "message": {"text": f"{f.message}: {f.explanation}"},
            "locations": [
                {
                    "physicalLocation": {
                        "artifactLocation": {"uri": f.file},
                        "region": {"startLine": f.line},
                    }
                }
            ],
        })

    sarif_data = {
        "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
        "version": "2.1.0",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": "omni-skill-security-scanner",
                        "version": "2.0.0",
                        "informationUri": "https://github.com/imMamdouhaboammar/get-fable",
                        "rules": list(rules_dict.values()),
                    }
                },
                "results": results,
            }
        ],
    }
    return json.dumps(sarif_data, indent=2)


# ---------------------------------------------------------------------------
# CLI Entrypoint
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Deterministic Agent Skill Security Scanner (SkillSpector Architecture)"
    )
    parser.add_argument("skill_path", type=Path, help="Path to skill directory or skill file")
    parser.add_argument(
        "--format",
        choices=["terminal", "json", "markdown", "sarif"],
        default="terminal",
        help="Report output format (default: terminal)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="File path to write report output",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit with code 1 on ANY finding regardless of threshold",
    )

    args = parser.parse_args()
    target = args.skill_path.resolve()

    if not target.exists():
        print(f"Error: Target path '{target}' does not exist.", file=sys.stderr)
        return 2

    if target.is_file():
        content = target.read_text(encoding="utf-8", errors="replace")
        findings = scan_text(content, target.name, is_script=target.suffix in (".py", ".sh", ".bash", ".js"))
        has_scripts = target.suffix in (".py", ".sh", ".bash", ".js")
        score, band, rec = compute_risk_score(findings, has_scripts, {target.name})
        report = ScanReport(
            target_path=str(target),
            skill_name=target.stem,
            risk_score=score,
            severity=band,
            recommendation=rec,
            findings=findings,
            files_analyzed=1,
            passed=rec in ("APPROVE", "CAUTION") and score < _RISK_THRESHOLD,
        )
    else:
        report = scan_skill_directory(target)

    # Format output
    if args.format == "terminal":
        out_text = format_terminal(report)
    elif args.format == "json":
        out_text = json.dumps(report.to_dict(), indent=2)
    elif args.format == "markdown":
        out_text = format_markdown(report)
    elif args.format == "sarif":
        out_text = format_sarif(report)
    else:
        out_text = format_terminal(report)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(out_text, encoding="utf-8")
        print(f"Security report saved to: {args.output}")
    else:
        print(out_text)

    if args.strict and report.findings:
        return 1

    return 0 if report.passed else 1


if __name__ == "__main__":
    sys.exit(main())
