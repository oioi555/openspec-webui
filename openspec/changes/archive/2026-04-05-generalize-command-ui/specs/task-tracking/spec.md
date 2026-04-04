## REMOVED Requirements

### Requirement: Expose the next apply command for active work
**Reason**: Command copy behavior is being generalized across workspace and change views, and the new shortcuts no longer depend on task-number labels.

**Migration**: Use the `command-shortcuts` capability for copyable `/opsx-*` or `/opsx:*` commands. Change-specific apply commands now use `/opsx-apply <change-name>` or `/opsx:apply <change-name>` without a trailing task label.
