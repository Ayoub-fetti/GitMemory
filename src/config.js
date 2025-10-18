const vscode = require('vscode');
const EventEmitter = require('events');
const notifier = require('./notifier');

const emitter = new EventEmitter();

let running = false;
const state = {
    // Map: uri -> lastText
    perFile: new Map(),
    // totals
    totals: {
        linesModified: 0,
        functionsAdded: 0,
    },
    // thresholds (default values)
    thresholds: {
        lines: 50,
        functions: 10,
    },
};

/**
 * Lit les paramètres utilisateur et met à jour les seuils.
 */
function updateThresholds() {
    const config = vscode.workspace.getConfiguration('commitReminder');
    state.thresholds.lines = config.get('linesThreshold', 50); // Valeur par défaut : 50
    state.thresholds.functions = config.get('functionsThreshold', 10); // Valeur par défaut : 10
    console.log('[tracker] Thresholds updated:', state.thresholds);
}

function start() {
    running = true;
    updateThresholds(); // Lire les paramètres utilisateur
    console.log('[tracker] started with thresholds:', state.thresholds);
}

function stop() {
    running = false;
    console.log('[tracker] stopped');
}

/**
 * Handler appelé lors des changements de document.
 * Expects a vscode.TextDocumentChangeEvent.
 */
function onDocumentChange(event) {
    if (!running) {
        start();
    }

    try {
        const doc = event.document;
        if (!doc) return;

        const uri = doc.uri.toString();
        const newText = doc.getText();
        const oldText = state.perFile.get(uri) || '';

        const modifiedLines = computeLineDiff(oldText, newText);
        const addedFunctions = detectAddedFunctions(oldText, newText);

        // Mettre à jour l'état par fichier
        state.perFile.set(uri, newText);

        // Mettre à jour les totaux
        state.totals.linesModified += modifiedLines;
        state.totals.functionsAdded += addedFunctions;

        // Vérifier si les seuils sont atteints
        if (
            state.totals.linesModified >= state.thresholds.lines ||
            state.totals.functionsAdded >= state.thresholds.functions
        ) {
            const payload = {
                totals: { ...state.totals },
                thresholds: { ...state.thresholds },
            };
            // Notifier l'utilisateur
            try {
                notifier.notify(
                    `Rappel de commit : ${state.totals.linesModified} lignes modifiées, ${state.totals.functionsAdded} fonctions ajoutées.`
                );
            } catch (e) {
                console.error('[tracker] notifier failed', e);
            }
            // Émettre un événement pour les consommateurs
            emitter.emit('threshold', payload);
            // Réinitialiser les compteurs après notification
            state.totals.linesModified = 0;
            state.totals.functionsAdded = 0;
        }
    } catch (err) {
        console.error('[tracker] onDocumentChange error:', err);
    }
}

// expose API
module.exports = {
    start,
    stop,
    onDocumentChange,
    handleChange: onDocumentChange,
    processChange: onDocumentChange,
    onThreshold: (handler) => emitter.on('threshold', handler),
    _getState: () => state,
};