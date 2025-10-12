
const vscode = require('vscode');

function activate(context) {


	console.log('Congratulations, your extension "gitmemory" is now active!');


	const disposable = vscode.commands.registerCommand('gitmemory.helloWorld', function () {

		vscode.window.showInformationMessage('Hello World from GitMemory!');
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
