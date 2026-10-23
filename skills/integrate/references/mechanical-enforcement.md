# Mechanical Enforcement Techniques

Patterns to lock out deprecated implementations structurally rather than relying on memory.

## 1. Import Restriction (TypeScript/JavaScript)
Use ESLint or Biome `no-restricted-imports`:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "lodash",
        "message": "Use native ES2022 array methods or structuredClone instead."
      }]
    }]
  }
}
```

## 2. Type System Deprecation & Narrowing
Annotate deprecated interfaces with `@deprecated` JSDoc to trigger IDE warnings, or remove the type completely from public exports:
```typescript
/** @deprecated Use compileOmniSkillSpec instead */
export function oldCompile() { ... }
```

## 3. Package Removal & Lockfile Cleanliness
The strongest mechanical enforcement is physical absence: when `old-pkg` is removed from `package.json`, any re-introduction fails at build time.
