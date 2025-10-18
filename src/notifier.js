const vscode = require('vscode');

/**
 * Affiche une notification avec des boutons "Faire un commit" et "Configurer".
 * @param {string} message - Le message à afficher dans la notification.
 */
function notify(message) {
    vscode.window.showInformationMessage(message, "Make a commit", "Configure").then((selection) => {
        if (selection === "Make a commit") {
            // Lancer la commande pour ouvrir la vue SCM
            vscode.commands.executeCommand('workbench.view.scm');
        } else if (selection === "Configure") {
            // Ouvrir les paramètres utilisateur pour l'extension
            vscode.commands.executeCommand('workbench.action.openSettings', 'commitReminder');
        }
    });
}

module.exports = {
    notify,
};