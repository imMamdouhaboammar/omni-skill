---
name: setup
description: >
  Set up OmniSkill after installation or check which skill workflows this host
  can execute. Use for first-run onboarding and capability troubleshooting,
  not for a general coding environment installation.
---

# Set up OmniSkill

1. Identify the intended job: create, audit, improve, port, or package a skill.
   Reuse the user's current request when it already says this.
2. Check which host capabilities are actually exposed: files, search, patch,
   shell, Python, and external documentation. Do not probe credentials or assume
   a signed-in account. A skills-only install requires no MCP connection or key.
3. Read `../host-workspace-operator/SKILL.md` if files are involved. Confirm the
   source and output scope; preserve unrelated work and existing authorization.
4. Report which operations can run here and which require a later host session.
   Without execution tools, design and static review can continue; tests remain
   unverified. Without source access, ask for the specific source needed.
5. Continue to `../omni-skill/SKILL.md` with one concrete task. Offer examples
   only when no task was supplied: turn an SOP into a skill, audit a skill's
   activation boundary, or adapt a skill for another host.

Do not install the optional CLI, dependencies, hooks, or background services as
part of setup unless the user requests them. Inspect commands before executing
bundled scripts. Never report installation or a passing test without host output.

Complete when the capability limits and next supported task are clear. Carry
those facts into the router so onboarding does not repeat on each step.
