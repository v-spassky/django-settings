## Configuration

Set `djangoSettings.settingsFiles` to the list of paths where to look for the settings definitions. The paths must be
relative to the workspace root.

Example in `settings.json`:

```json
"djangoSettings.settingsFiles": [
    "config/settings/base.py",
    "config/settings/local.py",
    "config/settings/test.py",
    "config/settings/production.py"
]
```

Example in the VSCode settings GUI:

![GUI configuration example](assets/gui_configuration_example.png)

## Features

### Go to definition

Tired of "Go to definition" on a `settings` object attribute taking you to
`django.conf._DjangoConfLazyObject.__getattr__`?

![Go to definition demo](assets/go_to_definition_demo.gif)

### Code completions

Tired of having to look up and copy-paste settings names by hand?

![Go to definition demo](assets/completions_demo.gif)
