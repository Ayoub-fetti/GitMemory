const vscode = require('vscode');

/**
 * Affiche une notification avec un bouton "Faire un commit".
 * @param {string} message - Le message à afficher dans la notification.
 */
function notify(message) {
    vscode.window.showInformationMessage(message, "Make a commit").then((selection) => {
        if (selection === "Make a commit") {
            // Lancer la commande pour ouvrir la vue SCM
            vscode.commands.executeCommand('workbench.view.scm');
        }
    });
}

module.exports = {
    notify,
};