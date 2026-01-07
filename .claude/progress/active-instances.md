# Active Instances Registry

This file tracks which features are currently being worked on to prevent conflicts.

## Currently Active

[None - all instances idle]

## Recently Completed

### Phase 1: Core Foundation - COMPLETE ✅
- Instance ID: claude-work-on-folded-heX1n
- Started: 2026-01-06 22:43:36
- Completed: 2026-01-07 00:30:00
- Summary: Full core foundation implemented - editor, storage, parser, renderer, syntax highlighting
- Status: Ready to merge

## Format

When starting work, add an entry like this:

```
### [Feature Name] - Phase [N]
- Instance ID: [unique-id or session-id]
- Started: [timestamp]
- Last Update: [timestamp]
- Status: [Active/Paused/Complete]
```

## Rules

1. **Update "Last Update" every 15-30 minutes** while actively working
2. **If "Last Update" > 60 minutes old**, instance is considered stale/crashed and can be taken over
3. **Remove your entry** when done or pausing work
4. **Only ONE active instance per feature** at a time
5. **Check this file on startup** before choosing what to work on

## Example

```
### Folding - Phase 2
- Instance ID: claude-session-abc123
- Started: 2026-01-06 10:30 AM
- Last Update: 2026-01-06 11:45 AM
- Status: Active

### Search - Phase 2
- Instance ID: claude-session-xyz789
- Started: 2026-01-06 09:00 AM
- Last Update: 2026-01-06 09:15 AM
- Status: Paused
```
