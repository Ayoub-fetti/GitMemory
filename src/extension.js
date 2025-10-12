
const vscode = require('vscode');
const tracker = require('./tracker');
const notifer = require('./notifier');
const config = require('./config')

function activate(context) {

	console.log('Congratulations, your extension "gitmemory" is now active!');
	
	// start tracker if available
	if (typeof tracker.start === 'funcion') {
		try {
			tracker.start();
		} catch (e) {
			console.log('tracker.start() failed:', e);
		}
	}
	const disposable = vscode.commands.registerCommand('gitmemory.helloWorld', function () {

		vscode.window.showInformationMessage('Hello World from GitMemory!');
	});

	context.subscriptions.push(disposable);

	    // Listen to document changes and forward to tracker (tries several common handler names)
	    const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        try {
            if (typeof tracker.onDocumentChange === 'function') {
                tracker.onDocumentChange(event);
            } else if (typeof tracker.handleChange === 'function') {
                tracker.handleChange(event);
            } else if (typeof tracker.processChange === 'function') {
                tracker.processChange(event);
            } else {
                // optional: notify if tracker has no handler
                if (typeof notifier.notify === 'function') {
                    notifier.notify('No tracker handler found for document change.');
                }
            }
        } catch (err) {
            console.error('Error while handling document change:', err);
        }
    });

	context.subscriptions.push(changeDisposable);
		// ensure tracker.stop is called on dispose 
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
}
