# Global Configuration

To create a global configuration file:

```bash
repomix --init --global
```

The global configuration file will be created in:

- Windows: `%LOCALAPPDATA%\Repomix\repomix.config.json`
- macOS/Linux: `$XDG_CONFIG_HOME/repomix/repomix.config.json` or `~/.config/repomix/repomix.config.json`

Note: Local configuration (if present) takes precedence over global configuration.
