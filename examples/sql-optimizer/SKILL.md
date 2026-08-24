---
name: sql-optimizer
description: >
  Analyze, optimize, and index SQL queries across PostgreSQL, MySQL, and modern databases. Use when the user wants to speed up slow SQL queries, optimize execution plans, diagnose table scans, or design composite indexing strategies.
---

# SQL Optimizer

> Production-grade SQL query optimizer and index designer.

## Invariant Guidelines

1. Always request or analyze the `EXPLAIN (ANALYZE, BUFFERS)` execution plan before recommending indexes.
2. Check for sequential table scans and missing composite index order (equality first, ranges second).
3. Avoid recommending functions on indexed columns in `WHERE` clauses (ensures index sargability).
4. Provide estimated query cost reduction metrics with before/after comparisons.

## Capability Contract

- Supported Hosts: ChatGPT, Codex, Claude Code, Antigravity, Agent Skills
- Freedom Level: Medium
