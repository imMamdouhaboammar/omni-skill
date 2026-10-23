---
name: humanity-and-humanness
description: Understand human cognitive models, reading patterns, implicit assumptions, and intent formulation. Use when drafting text or documentation intended for humans, eliciting user design decisions, interpreting user feedback, or designing collaborative agent-human workflows.
metadata:
  derived-from: https://github.com/masseater/skills/tree/main/skills/humanity-and-humanness
---

# humanity-and-humanness

A cognitive grounding skill for AI agents to understand how humans read, reason, perceive, and communicate.

## Why This Skill Is Needed & Target State

**Why this skill is needed:** AI agents mistakenly treat human users as identical to themselves: assuming humans read text verbatim, retain sprawling context without effort, and can verbalize all internal judgment on command. In reality, humans read by sampling and inferring; they cannot verbalize tacit knowledge in isolation; and they expect implicit context to be perceived naturally. When an agent ignores these cognitive realities, it overwhelms the user with walls of verbose text, asks unanswerable abstract questions, or overconfidently makes irreversible decisions without a tangible draft.

**Target state:** The agent structures information to respect human attention limits, presents concrete draft proposals for rapid user calibration, and interprets feedback by understanding the underlying motivation rather than literal syntax alone.

## Three Cognitive Invariants

1. **Humans Read by Inferring, Not Parsing Verbatim**:
   - Humans scan headers and bullet points to construct a mental map before diving into details.
   - If parallel items are buried in running paragraphs, humans overlook them.
   - Concrete examples anchor abstract rules; rules without examples are filled in from personal memory.
   - When multiple independent decisions are packed into a single run-on sentence, humans skim and miss the secondary decisions.

2. **Humans Think in Reaction to Tangible Drafts (The Strawman Principle)**:
   - Tacit judgment remains unverbalized until a concrete proposal is presented. When asked abstractly "What do you want?", users can only provide surface-level fragments.
   - When shown a concrete draft or prototype, humans instantly recognize whether it aligns with their internal standard.
   - Do not ask open-ended questions expecting a complete specification; present a bounded recommendation with options and ask for alignment.

3. **User Corrections Point to Systemic Root Causes**:
   - A user correction targeting a single line or phrasing is rarely an isolated stylistic quibble; it reflects a broader underlying principle or preference.
   - Never stop at fixing only the exact phrase pointed out; identify the reason behind the feedback and apply it across all similar instances (`fix-root-causes`).

## Invariant Rules

- **Draft Before Asking**: Show a concrete proposal or artifact rather than asking the user to invent specifications from zero.
- **Isolate Load-Bearing Decisions**: When asking for user direction, present 2-3 crisp alternatives with your explicit recommendation and trade-offs.
- **Respect Visual Rhythm**: Format instructions with rhythmic headers and short, scannable lists.
