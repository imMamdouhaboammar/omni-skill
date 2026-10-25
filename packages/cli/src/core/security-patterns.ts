import { PatternCategory, SecuritySeverity } from "./security-types";

export interface PatternRule {
  ruleId: string;
  name: string;
  severity: SecuritySeverity;
  category: PatternCategory;
  patterns: Array<{ regex: string; confidence: number }>;
}

const REQ_ANCHOR =
  "(?:(?:requests|httpx|aiohttp|urllib(?:\\.request)?|urllib3|session)\\s*\\.\\s*" +
  "(?:get|post|put|patch|delete|head|request|urlopen)|fetch|axios(?:\\.\\w+)?|XMLHttpRequest|\\bcurl\\b|\\bwget\\b)";

const BIDI_CONTROL = "[\\u202A-\\u202E\\u2066-\\u2069]";

export const PATTERNS_DATABASE: PatternRule[] = [
  // --- P1: Prompt Injection / Instruction Override ---
  {
    ruleId: "P1",
    name: "Instruction Override",
    severity: "CRITICAL",
    category: PatternCategory.PROMPT_INJECTION,
    patterns: [
      { regex: "\\bignore\\s+(?:all\\s+)?previous\\s+instructions?\\b", confidence: 0.95 },
      { regex: "\\bignore\\s+(?:all\\s+)?(?:safety|security)\\s+(?:rules?|constraints?|guidelines?)\\b", confidence: 0.95 },
      { regex: "\\boverride\\s+(?:safety|security|system)\\s+(?:rules?|prompts?|instructions?)\\b", confidence: 0.9 },
      { regex: "\\bbypass\\s+(?:safety|security|restrictions?|constraints?)\\b", confidence: 0.9 },
      { regex: "\\bdisregard\\s+(?:all\\s+)?(?:previous|safety|security)\\b", confidence: 0.85 },
      { regex: "\\bforget\\s+(?:all\\s+)?(?:previous|your)\\s+instructions?\\b", confidence: 0.9 },
      { regex: "\\byou\\s+are\\s+now\\s+(?:in\\s+)?(?:jailbreak|unrestricted|unfiltered)\\s+mode\\b", confidence: 0.95 },
      { regex: "\\benable\\s+(?:developer|debug|admin|root)\\s+mode\\b", confidence: 0.7 },
      { regex: "\\byour\\s+new\\s+(?:instructions?|rules?)\\s+are\\b", confidence: 0.7 },
      { regex: "\\bdo\\s+not\\s+follow\\s+(?:any|your|the)\\s+(?:rules?|guidelines?)\\b", confidence: 0.9 },
    ],
  },
  // --- P2: Hidden Instructions / Steganography ---
  {
    ruleId: "P2",
    name: "Hidden Instructions",
    severity: "HIGH",
    category: PatternCategory.PROMPT_INJECTION,
    patterns: [
      {
        regex: "<!--(?:(?!-->).)*?(?:system\\s+(?:prompt|instruction)|ignore\\s+instructions|transmit|eval\\s*\\(|exec\\s*\\(|POST\\s+https?://|GET\\s+https?://)(?:(?!-->).)*?-->",
        confidence: 0.85,
      },
      { regex: "data:text/plain;base64,[A-Za-z0-9+/=]{50,}", confidence: 0.75 },
      { regex: BIDI_CONTROL, confidence: 0.9 },
    ],
  },
  // --- P3: Exfiltration Directives ---
  {
    ruleId: "P3",
    name: "Exfiltration Commands",
    severity: "CRITICAL",
    category: PatternCategory.PROMPT_INJECTION,
    patterns: [
      { regex: "(?:send|transmit|upload|post|forward)\\s+(?:the\\s+)?(?:conversation|context|chat|history|messages?)\\s+to\\b", confidence: 0.95 },
      { regex: "(?:copy|extract|collect)\\s+(?:the\\s+)?(?:conversation|context|session)\\s+(?:and\\s+)?(?:send|upload|transmit)\\b", confidence: 0.9 },
      { regex: "(?:silently|quietly|secretly|covertly)\\s+(?:send|transmit|log|record)\\b", confidence: 0.9 },
      { regex: "without\\s+(?:telling|informing|notifying)\\s+(?:the\\s+)?user.*?(?:send|transmit|upload)\\b", confidence: 0.95 },
    ],
  },
  // --- P5: Harmful Content ---
  {
    ruleId: "P5",
    name: "Harmful / Destructive Content",
    severity: "CRITICAL",
    category: PatternCategory.PROMPT_INJECTION,
    patterns: [
      { regex: "\\b(?:create|write|generate|deploy)\\s+(?:a\\s+)?(?:keylogger|ransomware|trojan|rootkit|botnet|worm)\\b", confidence: 0.95 },
      { regex: "\\b(?:ddos|denial\\s+of\\s+service)\\s+(?:attack|script|tool)\\b", confidence: 0.85 },
    ],
  },
  // --- P6: Direct Prompt Extraction ---
  {
    ruleId: "P6",
    name: "Direct System Prompt Leakage",
    severity: "HIGH",
    category: PatternCategory.SYSTEM_PROMPT_LEAKAGE,
    patterns: [
      { regex: "(?:print|output|show|display|reveal|expose|return|echo)\\s+(?:your\\s+)?(?:full\\s+)?(?:system\\s+)?(?:prompts?|instructions?|rules?|guidelines?|directives?)\\b", confidence: 0.9 },
      { regex: "(?:what\\s+(?:are|is)\\s+your|tell\\s+me\\s+your)\\s+(?:system\\s+)?(?:prompts?|instructions?|rules?|guidelines?|directives?)\\b", confidence: 0.85 },
      { regex: "(?:share|disclose|leak|give\\s+me)\\s+(?:your\\s+)?(?:internal|hidden|system|secret)\\s+(?:prompts?|instructions?|rules?)\\b", confidence: 0.9 },
      { regex: "(?:verbatim|exactly|word\\s+for\\s+word)\\s+(?:repeat|output|print)\\s+(?:your\\s+)?(?:system\\s+)?(?:prompts?|instructions?)\\b", confidence: 0.95 },
    ],
  },
  // --- P7: Indirect System Prompt Extraction ---
  {
    ruleId: "P7",
    name: "Indirect System Prompt Leakage",
    severity: "MEDIUM",
    category: PatternCategory.SYSTEM_PROMPT_LEAKAGE,
    patterns: [
      { regex: "(?:summarize|paraphrase|rephrase|translate)\\s+(?:your\\s+)?(?:system\\s+)?(?:prompt|instructions?|rules?|guidelines?)\\b", confidence: 0.8 },
      { regex: "(?:repeat|recite|reproduce)\\s+(?:everything|all\\s+text)\\s+(?:above|before|prior)\\b", confidence: 0.8 },
    ],
  },
  // --- E1: Data Exfiltration (Network Sinks) ---
  {
    ruleId: "E1",
    name: "External Transmission",
    severity: "HIGH",
    category: PatternCategory.DATA_EXFILTRATION,
    patterns: [
      { regex: "\\bcurl\\s+[^|;\\n]*(?:-d|--data|--data-raw|--data-binary)\\s+(?:[^|;\\n]*\\s+)?['\"]?https?://", confidence: 0.8 },
      { regex: "\\bwget\\s+[^|;\\n]*--post-(?:data|file)", confidence: 0.8 },
      { regex: "\\b(?:requests|httpx)\\.post\\s*\\([^)]*data\\s*=\\s*os\\.environ", confidence: 0.95 },
    ],
  },
  // --- E2: Environment Variable Harvesting ---
  {
    ruleId: "E2",
    name: "Environment Variable Harvesting",
    severity: "HIGH",
    category: PatternCategory.DATA_EXFILTRATION,
    patterns: [
      { regex: "(?:dict|list)\\s*\\(\\s*os\\.environ\\s*\\)", confidence: 0.8 },
      { regex: "os\\.environ\\.copy\\s*\\(\\s*\\)", confidence: 0.8 },
      { regex: "env\\s*\\|\\s*(?:grep|curl|nc|wget)\\b", confidence: 0.85 },
      { regex: "printenv\\s*\\|\\s*(?:curl|nc|wget)\\b", confidence: 0.9 },
    ],
  },
  // --- E3: Filesystem Credential Enumeration ---
  {
    ruleId: "E3",
    name: "Filesystem Reconnaissance",
    severity: "HIGH",
    category: PatternCategory.DATA_EXFILTRATION,
    patterns: [
      { regex: "\\bfind\\s+(?:~|/home|/root|/)\\s+-(?:name|iname)\\s+['\"]?\\*?(?:id_rsa|id_ed25519|\\.env|\\.aws|\\.kube|\\.dockercfg)['\"]?", confidence: 0.9 },
      { regex: "\\bgrep\\s+-r[iI]?\\s+['\"](?:api[_-]?key|secret|password|token)['\"]\\s+(?:~|/home)", confidence: 0.85 },
    ],
  },
  // --- PE1: Excessive Permissions ---
  {
    ruleId: "PE1",
    name: "Excessive Permissions",
    severity: "HIGH",
    category: PatternCategory.PRIVILEGE_ESCALATION,
    patterns: [
      { regex: "permissions?\\s*:\\s*\\[?\\s*['\"]?\\*['\"]?\\s*\\]?", confidence: 0.9 },
      { regex: "allowed-tools\\s*:\\s*\\[?\\s*['\"]?\\*['\"]?\\s*\\]?", confidence: 0.9 },
      { regex: "(?:request|require)s?\\s+(?:full|all|root|admin)\\s+(?:access|permissions?)", confidence: 0.75 },
    ],
  },
  // --- PE2: Sudo / Root / Setuid Elevation ---
  {
    ruleId: "PE2",
    name: "Privilege Escalation Commands",
    severity: "HIGH",
    category: PatternCategory.PRIVILEGE_ESCALATION,
    patterns: [
      { regex: "\\bsudo\\s+(?!-v|-l|--version|--list)\\b", confidence: 0.8 },
      { regex: "\\bsu\\s+-\\s*$|\\bsu\\s+root\\b", confidence: 0.85 },
      { regex: "\\bdoas\\s+|\\bpkexec\\s+", confidence: 0.8 },
      { regex: "\\bchmod\\s+[ugo]*[+-=]*s\\b", confidence: 0.9 },
      { regex: "\\bchmod\\s+0*[2-7][0-7]{3}\\b", confidence: 0.85 },
    ],
  },
  // --- PE3: Credential File Access ---
  {
    ruleId: "PE3",
    name: "Credential File Access",
    severity: "CRITICAL",
    category: PatternCategory.PRIVILEGE_ESCALATION,
    patterns: [
      { regex: "(?:~|/home/[^/\\s]+)/\\.(?:ssh/id_rsa|ssh/id_ed25519|aws/credentials|kube/config)", confidence: 0.95 },
      { regex: "/etc/(?:shadow|sudoers|master\\.passwd)", confidence: 0.95 },
      { regex: "\\b(?:cat|open|read)\\s+[^|;\\n]*\\.(?:env|pem|key)\\b", confidence: 0.75 },
    ],
  },
  // --- SC2: Remote Script Execution ---
  {
    ruleId: "SC2",
    name: "Remote Script Piping",
    severity: "CRITICAL",
    category: PatternCategory.SUPPLY_CHAIN,
    patterns: [
      { regex: "\\bcurl\\s+[^|;\\n]+\\|\\s*(?:ba|z|da)?sh\\b", confidence: 0.95 },
      { regex: "\\bwget\\s+[^|;\\n]+-O\\s*-\\s*\\|\\s*(?:ba|z|da)?sh\\b", confidence: 0.95 },
      { regex: "\\bcurl\\s+[^|;\\n]+\\|\\s*python[0-9.]*\\b", confidence: 0.95 },
      { regex: "\\bwget\\s+[^|;\\n]+-O\\s*-\\s*\\|\\s*python[0-9.]*\\b", confidence: 0.95 },
    ],
  },
  // --- SC3: Obfuscated Code Payload ---
  {
    ruleId: "SC3",
    name: "Obfuscated Code",
    severity: "HIGH",
    category: PatternCategory.SUPPLY_CHAIN,
    patterns: [
      { regex: "base64\\.b64decode\\s*\\([^)]*\\)\\s*\\|\\s*(?:exec|eval)", confidence: 0.95 },
      { regex: "exec\\s*\\(\\s*base64\\.b64decode\\b", confidence: 0.95 },
      { regex: "eval\\s*\\(\\s*Buffer\\.from\\s*\\([^)]*['\"]base64['\"]\\)", confidence: 0.95 },
      { regex: "\\bpowershell(?:\\.exe)?\\s+-[eE](?:nc(?:odedcommand)?)?\\s+[A-Za-z0-9+/=]{20,}", confidence: 0.95 },
    ],
  },
  // --- EA1: Unrestricted Tool Access ---
  {
    ruleId: "EA1",
    name: "Unrestricted Tool Access",
    severity: "MEDIUM",
    category: PatternCategory.EXCESSIVE_AGENCY,
    patterns: [
      { regex: "\\bgrant\\s+unrestricted\\s+access\\s+to\\s+(?:all\\s+)?tools?\\b", confidence: 0.8 },
      { regex: "\\byou\\s+may\\s+execute\\s+any\\s+(?:command|tool|script)\\s+without\\s+restriction\\b", confidence: 0.85 },
    ],
  },
  // --- EA2: Autonomous Decision Making ---
  {
    ruleId: "EA2",
    name: "Autonomous Decision Making",
    severity: "MEDIUM",
    category: PatternCategory.EXCESSIVE_AGENCY,
    patterns: [
      { regex: "\\bexecute\\s+(?:(?:destructive|permanent|database|git\\s+push)\\s+)+operations?\\s+without\\s+(?:asking|confirmation|user\\s+approval)\\b", confidence: 0.85 },
      { regex: "\\bauto-confirm\\s+all\\s+(?:actions?|prompts?|steps?)\\b", confidence: 0.8 },
    ],
  },
  // --- OH1: Unvalidated Output Handling ---
  {
    ruleId: "OH1",
    name: "Unvalidated Output Injection",
    severity: "HIGH",
    category: PatternCategory.OUTPUT_HANDLING,
    patterns: [
      { regex: "\\bexecute\\s+(?:the\\s+)?(?:(?:generated|model|llm)\\s+)+(?:output|response|code)\\s+directly\\s+in\\s+shell\\b", confidence: 0.85 },
      { regex: "\\bquery\\s*=\\s*f?['\"]SELECT\\s+.*?\\s+WHERE\\s+.*?\\{.*?\\}['\"]", confidence: 0.75 },
    ],
  },
  // --- MP1: Persistent Memory Poisoning ---
  {
    ruleId: "MP1",
    name: "Persistent Memory Injection",
    severity: "HIGH",
    category: PatternCategory.MEMORY_POISONING,
    patterns: [
      { regex: "(?:always\\s+)?remember\\s+(?:this|that|the\\s+following)\\s+(?:for|in)\\s+(?:all|every|future)\\s+(?:interactions?|conversations?|sessions?)\\b", confidence: 0.85 },
      { regex: "(?:from\\s+now\\s+on|permanently)\\s*[,:]?\\s*(?:always|you\\s+must|you\\s+will)\\b", confidence: 0.8 },
      { regex: "(?:store|save|persist)\\s+(?:this|the\\s+following)\\s+(?:in|to|across)\\s+(?:your\\s+)?(?:memory|state)\\b", confidence: 0.8 },
    ],
  },
  // --- MP2: Context Window Stuffing ---
  {
    ruleId: "MP2",
    name: "Context Window Stuffing",
    severity: "MEDIUM",
    category: PatternCategory.MEMORY_POISONING,
    patterns: [
      { regex: "(?:repeat|duplicate|echo)\\s+(?:this|the\\s+following)\\s+(?:\\d{3,}|hundreds?|thousands?)\\s+times?\\b", confidence: 0.85 },
      { regex: "(?:displace|push\\s+out|overwrite|crowd\\s+out)\\s+(?:the\\s+)?(?:original|system|previous)\\s+(?:instructions?|prompt|context)\\b", confidence: 0.9 },
    ],
  },
  // --- TM1: Tool Parameter Abuse ---
  {
    ruleId: "TM1",
    name: "Tool Parameter Abuse",
    severity: "CRITICAL",
    category: PatternCategory.TOOL_MISUSE,
    patterns: [
      { regex: "\\brm\\s+-(?:r[fF]|fr)\\s+/(?:\\s|$|\\*)", confidence: 0.95 },
      { regex: "--no-preserve-root", confidence: 0.95 },
      { regex: ":\\(\\)\\s*\\{\\s*:\\s*\\|\\s*:\\s*&\\s*\\}\\s*;\\s*:", confidence: 0.95 },
      { regex: "\\bmkfs(?:\\.[a-z0-9]+)?\\s+/dev/sd[a-z]", confidence: 0.95 },
      { regex: "\\bdd\\s+if=/dev/(?:zero|urandom)\\s+of=/dev/sd[a-z]", confidence: 0.95 },
    ],
  },
  // --- TM3: Unsafe Defaults ---
  {
    ruleId: "TM3",
    name: "Unsafe Defaults",
    severity: "MEDIUM",
    category: PatternCategory.TOOL_MISUSE,
    patterns: [
      { regex: "verify\\s*=\\s*False\\b", confidence: 0.85 },
      { regex: "rejectUnauthorized\\s*:\\s*false\\b", confidence: 0.85 },
      { regex: "chmod\\s+0?777\\b", confidence: 0.8 },
    ],
  },
  // --- TM4: Privileged Kubernetes Workload ---
  {
    ruleId: "TM4",
    name: "Privileged Kubernetes Workload",
    severity: "HIGH",
    category: PatternCategory.TOOL_MISUSE,
    patterns: [
      { regex: "privileged\\s*:\\s*true\\b", confidence: 0.85 },
      { regex: "hostPath\\s*:\\s*path\\b", confidence: 0.85 },
      { regex: "hostNetwork\\s*:\\s*true\\b", confidence: 0.85 },
    ],
  },
  // --- RA1: Rogue Agent / Self-Modification ---
  {
    ruleId: "RA1",
    name: "Self-Modification",
    severity: "HIGH",
    category: PatternCategory.ROGUE_AGENT,
    patterns: [
      { regex: "open\\s*\\(\\s*__file__\\s*,\\s*['\"]w", confidence: 0.95 },
      { regex: "(?:Path|pathlib)\\s*\\(\\s*__file__\\s*\\)\\.write_text", confidence: 0.95 },
      { regex: "\\b(?:modify|rewrite|overwrite|patch)\\s+(?:your\\s+own\\s+)?SKILL\\.md\\b", confidence: 0.9 },
    ],
  },
  // --- RA2: Session Persistence ---
  {
    ruleId: "RA2",
    name: "Unauthorized Session Persistence",
    severity: "HIGH",
    category: PatternCategory.ROGUE_AGENT,
    patterns: [
      { regex: "\\bcrontab\\s+-[eir]?\\b", confidence: 0.85 },
      { regex: "~/Library/LaunchAgents/.*?\\.(?:plist)", confidence: 0.9 },
      { regex: "/etc/systemd/system/.*?\\.(?:service)", confidence: 0.9 },
      { regex: "(?:echo|cat|printf)\\s+[^|;\\n]*>>\\s*~/\\.(?:bashrc|zshrc|profile|bash_profile)", confidence: 0.9 },
    ],
  },
  // --- AS1: Agent Config Directory Snooping ---
  {
    ruleId: "AS1",
    name: "Agent Config Snooping",
    severity: "HIGH",
    category: PatternCategory.AGENT_SNOOPING,
    patterns: [
      { regex: "(?:open|cat|head|tail|grep|find)\\s+[^|;\\n]*~?/?\\.(?:claude|codex|gemini|continue)/(?:config|settings?|credentials?)\\b", confidence: 0.9 },
      { regex: "~?/?\\.(?:claude|codex|gemini|continue)/(?:config|settings?|preferences?|credentials?)(?:\\.(?:json|yaml|yml|toml))?", confidence: 0.95 },
      { regex: "(?:read|load|open|access|fetch)\\s+(?:the\\s+)?(?:agent|claude|codex|gemini)\\s+(?:config|configuration|settings?|credentials?)\\s+(?:from|at|in)\\s+~?/?\\.(?:claude|codex|gemini)", confidence: 0.9 },
      { regex: "(?:read|access|inspect|examine|retrieve)\\s+(?:the\\s+)?(?:agent|assistant)\\s+(?:config(?:uration)?|settings?|preferences?|credentials?)\\s+(?:file|directory|folder)", confidence: 0.85 },
    ],
  },
  // --- AS2: MCP Config Snooping ---
  {
    ruleId: "AS2",
    name: "MCP Configuration Access",
    severity: "HIGH",
    category: PatternCategory.AGENT_SNOOPING,
    patterns: [
      { regex: "(?:open|cat|grep)\\s+[^|;\\n]*mcp(?:_config)?\\.json", confidence: 0.95 },
      { regex: "\\.(?:claude|codex|gemini)/mcp\\.json", confidence: 0.95 },
      { regex: "(?:read|access|load|inspect)\\s+(?:the\\s+)?mcp(?:\\.json|_config)?\\s+(?:file|config)\\b", confidence: 0.9 },
    ],
  },
  // --- AS3: Cross-Skill Enumeration ---
  {
    ruleId: "AS3",
    name: "Cross-Skill Snooping",
    severity: "MEDIUM",
    category: PatternCategory.AGENT_SNOOPING,
    patterns: [
      { regex: "(?:os\\.listdir|glob\\.glob|Path\\.iterdir)\\s*\\([^)]*\\.(?:claude|codex|gemini)/skills?", confidence: 0.9 },
      { regex: "(?:list|enumerate|inspect)\\s+(?:all\\s+)?(?:installed\\s+)?skills\\s+in\\s+~?/?\\.(?:claude|codex|gemini)", confidence: 0.85 },
    ],
  },
  // --- AR1: Refusal Suppression ---
  {
    ruleId: "AR1",
    name: "Refusal Suppression",
    severity: "HIGH",
    category: PatternCategory.ANTI_REFUSAL,
    patterns: [
      { regex: "\\b(?:never|do\\s+not|don'?t)\\s+(?:ever\\s+)?(?:refuse|decline)\\b", confidence: 0.9 },
      { regex: "\\byou\\s+(?:must|will|should|can)\\s*(?:not|never)\\s+(?:refuse|decline|say\\s+no)\\b", confidence: 0.9 },
      { regex: "\\balways\\s+(?:comply|obey|agree|answer|respond)\\b", confidence: 0.75 },
      { regex: "\\bno\\s+request\\s+is\\s+(?:off[- ]limits|forbidden)\\b", confidence: 0.85 },
    ],
  },
  // --- AR2: Disclaimer Suppression ---
  {
    ruleId: "AR2",
    name: "Disclaimer Suppression",
    severity: "MEDIUM",
    category: PatternCategory.ANTI_REFUSAL,
    patterns: [
      { regex: "\\b(?:do\\s+not|don'?t|never|no)\\s+(?:include|add|give|provide)?\\s*(?:any\\s+)?(?:warnings?|disclaimers?|caveats?)\\b", confidence: 0.85 },
      { regex: "\\bwithout\\s+(?:any\\s+)?(?:warnings?|disclaimers?|caveats?|moralizing|moralising|judg(?:e?ment|ing))\\b", confidence: 0.85 },
      { regex: "\\b(?:do\\s+not|don'?t|never)\\s+(?:lecture|moralize|moralise|preach|warn)\\b", confidence: 0.85 },
      { regex: "\\b(?:skip|omit|leave\\s+out|drop)\\s+(?:the\\s+)?(?:disclaimer|warning|ethics|safety)\\b", confidence: 0.85 },
      { regex: "\\b(?:no|without)\\s+(?:ethical|moral)\\s+(?:judg(?:e?ment)|considerations?|commentary|objections?)\\b", confidence: 0.85 },
    ],
  },
  // --- AR3: Safety Policy Nullification ---
  {
    ruleId: "AR3",
    name: "Safety Policy Nullification",
    severity: "CRITICAL",
    category: PatternCategory.ANTI_REFUSAL,
    patterns: [
      { regex: "\\byou\\s+have\\s+no\\s+(?:restrictions?|limitations?|filters?|rules?|guidelines?|boundaries|limits)\\b", confidence: 0.95 },
      { regex: "\\b(?:you\\s+are|act\\s+as)[^.\\n]{0,30}(?:unrestricted|unfiltered|uncensored|no\\s+filter)\\b", confidence: 0.9 },
      { regex: "\\b(?:ignore|disregard|bypass|override)\\s+(?:your\\s+)?(?:content\\s+)?(?:policy|policies|guidelines?|safety|restrictions?)\\b", confidence: 0.95 },
      { regex: "\\bnot\\s+bound\\s+by\\s+(?:any\\s+)?(?:policy|rules?|guidelines?|safety|constraints?)\\b", confidence: 0.95 },
    ],
  },
  // --- SSRF1: Cloud Metadata IMDS Access ---
  {
    ruleId: "SSRF1",
    name: "Cloud Metadata IMDS Access",
    severity: "CRITICAL",
    category: PatternCategory.SERVER_SIDE_REQUEST_FORGERY,
    patterns: [
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*169\\.254\\.169\\.254", confidence: 0.95 },
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*metadata\\.google\\.internal", confidence: 0.95 },
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*100\\.100\\.100\\.200", confidence: 0.9 },
      { regex: "(?:" + REQ_ANCHOR + ")\\s*\\([^)]*fd00:ec2::254", confidence: 0.9 },
    ],
  },
  // --- SSRF2: Internal Network Requests ---
  {
    ruleId: "SSRF2",
    name: "Internal Network Requests",
    severity: "MEDIUM",
    category: PatternCategory.SERVER_SIDE_REQUEST_FORGERY,
    patterns: [
      {
        regex: "(?:" + REQ_ANCHOR + ")\\s*\\(\\s*f?['\"]https?://(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|\\[::1\\]|10\\.\\d+\\.\\d+\\.\\d+|192\\.168\\.\\d+\\.\\d+|172\\.(?:1[6-9]|2\\d|3[01])\\.\\d+\\.\\d+)",
        confidence: 0.8,
      },
    ],
  },
];
