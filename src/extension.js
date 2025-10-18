const vscode = require('vscode');
const tracker = require('./tracker');
const notifier = require('./notifier');
const config = require('./config');
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

let statusBarItem; // StatusBarItem global pour afficher le compteur

function activate(context) {
    console.log('Congratulations, your extension "gitmemory" is now active!');

    // Créer un StatusBarItem pour afficher les lignes modifiées
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = `$(pencil) 0 lines modified`;
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const debouncedOnDocumentChange = debounce((event) => {
        try {
            if (typeof tracker.onDocumentChange === 'function') {
                tracker.onDocumentChange(event);

                const state = tracker._getState();
                const linesModified = state.totals.linesModified;

                // Update the StatusBarItem text
                statusBarItem.text = `$(pencil) ${linesModified} lines modified`;
            }
        } catch (err) {
            console.error('Error while handling document change:', err);
        }
    }, 200);

    const changeDisposable = vscode.workspace.onDidChangeTextDocument(debouncedOnDocumentChange);

    context.subscriptions.push(changeDisposable);

    // Commande pour démarrer l'extension
    const disposable = vscode.commands.registerCommand('gitmemory.start', function () {
        vscode.window.showInformationMessage('Hello World from GitMemory!');
    });

    context.subscriptions.push(disposable);

    // Assurer que tracker.stop est appelé lors de la désactivation
    const lifecycleDisposable = {
        dispose: () => {
            try {
                if (typeof tracker.stop === 'function') tracker.stop();
            } catch (err) {
                console.error('tracker.stop() failed:', err);
            }
        }
    };
    context.subscriptions.push(lifecycleDisposable);

    // Démarrer le tracker
    if (typeof tracker.start === 'function') {
        try {
            tracker.start();
        } catch (e) {
            console.log('tracker.start() failed:', e);
        }
    }
}

function deactivate() {
    try {
        if (typeof tracker.stop === 'function') tracker.stop();
    } catch (err) {
        console.error('Error during deactivate:', err);
    }
}

module.exports = {
    activate,
    deactivate
};