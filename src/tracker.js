const vscode = require('vscode');
const EventEmitter = require('events');
const notifier = require('./notifier');
const config = require('./config');

const emitter = new EventEmitter();

let running = false;
const state = {
    perFile: new Map(),
    totals: {
        linesModified: 0,
        functionsAdded: 0,
    },
    threshold: 50,
};

function start() {
    running = true;
    const config = vscode.workspace.getConfiguration('commitReminder');
    state.threshold = config.get('linesThreshold', 50);
    console.log('[tracker] started, threshold=', state.threshold);
}

function stop() {
    running = false;
    console.log('[tracker] stopped');
}

function computeLineDiff(oldText = '', newText = '') {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    // Compter seulement les lignes réellement ajoutées/supprimées
    const oldCount = oldLines.length;
    const newCount = newLines.length;

    return Math.abs(newCount - oldCount);
}

function extractFunctionNames(text = '') {
    const names = new Set();
    const funcDeclRe = /(?:^|[\s\n])function\s+([A-Za-z0-9_$]+)\s*\(/g;
    let m;
    while ((m = funcDeclRe.exec(text))) {
        if (m[1]) names.add(m[1]);
    }

    const assignRe = /(?:^|[\s\n])(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function\s*\(|\()/g;
    while ((m = assignRe.exec(text))) {
        if (m[1]) names.add(m[1]);
    }

    return names;
}

function detectAddedFunctions(oldText = '', newText = '') {
    const oldSet = extractFunctionNames(oldText);
    const newSet = extractFunctionNames(newText);
    let added = 0;
    for (const n of newSet) {
        if (!oldSet.has(n)) added++;
    }
    return added;
}

function onDocumentChange(event) {
    if (!running) {
        start();
    }

    try {
        const doc = event.document;
        if (!doc) return;

        const uri = doc.uri.toString();
        const newText = doc.getText();

        if (!state.perFile.has(uri)) {
            // Premier enregistrement du fichier
            state.perFile.set(uri, newText);
            return;
        }

        const oldText = state.perFile.get(uri);
        const modifiedLines = computeLineDiff(oldText, newText);
        const addedFunctions = detectAddedFunctions(oldText, newText);

        state.perFile.set(uri, newText);

        // Mise à jour des totaux seulement si il y a vraiment des changements
        if (modifiedLines > 0) {
            state.totals.linesModified += modifiedLines;
        }
        if (addedFunctions > 0) {
            state.totals.functionsAdded += addedFunctions;
        }

        if (
            state.totals.linesModified >= state.threshold ||
            state.totals.functionsAdded >= state.threshold
        ) {
            try {
                notifier.notify(
                    `Commit reminder: ${state.totals.linesModified} lines modified, ${state.totals.functionsAdded} functions added.`
                );
            } catch (e) {
                console.error('[tracker] notifier failed', e);
            }

            emitter.emit('threshold', {
                totals: { ...state.totals },
                threshold: state.threshold,
            });

            state.totals.linesModified = 0;
            state.totals.functionsAdded = 0;
        }
    } catch (err) {
        console.error('[tracker] onDocumentChange error:', err);
    }
}

module.exports = {
    start,
    stop,
    onDocumentChange,
    handleChange: onDocumentChange,
    processChange: onDocumentChange,
    onThreshold: (handler) => emitter.on('threshold', handler),
    _getState: () => state,
};
