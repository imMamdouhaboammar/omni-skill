# Distribution runtime preflight

Select the requested channel first. Check only tools that action actually uses.
For repository changes, use an available GitHub connector or authenticated CLI.
For local scripts, inspect their commands and use the existing package manager.
For deterministic Python helpers, check Python 3 and the script's dependencies.

Do not probe global agent configuration directories or install missing tools as
an implicit setup step. Follow the user's authorization before dependency changes,
network operations, installers, or publication. Missing tools block only dependent
actions; complete independent metadata and static review work.

The optional installer takes one explicit new destination with an existing parent.
It refuses replacement and destinations inside its own source. Review the source,
then invoke `bash install.sh <new-skill-directory>` only when installation is
requested. It does not discover agent directories or erase previous installs.

Use `../omni-skill/scripts/validate_portability.py` relative to this skill directory for static portability checks. Host-native tools do not become available
because a plugin declares them. Report unrun checks and unavailable runtimes.
