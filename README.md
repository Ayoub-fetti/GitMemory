# GitMemory

GitMemory is a Visual Studio Code extension designed to help developers keep track of their code changes and remind them to commit frequently. It monitors the number of lines modified and functions added in your workspace and notifies you when thresholds are reached.

## Features

- **Real-time Change Tracking**: Tracks the number of lines modified and functions added in your workspace.
- **Customizable Thresholds**: Set thresholds for lines modified and functions added before receiving a commit reminder.
- **Status Bar Integration**: Displays the current count of modified lines and added functions in the status bar.
- **Commit Reminder Notifications**: Notifies you when thresholds are reached, with options to make a commit or configure settings.

![Status Bar Example](images/status-bar-example.png)

## Requirements

- Visual Studio Code version `^1.105.0` or higher.

## Extension Settings

This extension contributes the following settings:

- **`gitmemory.linesThreshold`**: The number of lines modified before triggering a commit reminder. Default: `50`.
- **`gitmemory.functionsThreshold`**: The number of functions added before triggering a commit reminder. Default: `2`.

## Commands

- **`GitMemory: Start the Extension`**: Activates the GitMemory extension.

## Known Issues

- Notifications may not appear if the extension is not properly activated. Ensure the extension is running and the workspace is open.
- The extension currently tracks changes only in text documents.

## Release Notes

### 0.0.1

- Initial release of GitMemory.
- Tracks lines modified and functions added.
- Displays a status bar item with real-time updates.
- Sends notifications when thresholds are reached.

---

## Contributing

Contributions are welcome! If you encounter any issues or have feature requests, please open an issue or submit a pull request on the [GitHub repository](https://github.com/Ayoub-fetti/GitMemory).


---

**Enjoy using GitMemory!**