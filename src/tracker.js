const EventEmitter = require('events');
const notifier = require('./notifier');
const config = require('./config');

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
    // threshold (fallback if config.threshold absent)
    threshold: (config && config.commitThreshold) || (config && config.threshold) || 50,
};

function start() {
    running = true;
    // could load persisted state here in the future
    console.log('[tracker] started, threshold=', state.threshold);
}

function stop() {
    running = false;
    console.log('[tracker] stopped');
}


 // Compute number of differing lines between two texts.

function computeLineDiff(oldText = '', newText = '') {
    const oldLines = oldText.split(/\r?\n/);
    const newLines = newText.split(/\r?\n/);
    const minLen = Math.min(oldLines.length, newLines.length);
    let diff = 0;
    for (let i = 0; i < minLen; i++) {
        if (oldLines[i] !== newLines[i]) diff++;
    }
    // account for added/removed trailing lines
    diff += Math.abs(oldLines.length - newLines.length);
    return diff;
}


 // Extract function signatures/names from text using regex heuristics.
 // Returns Set of names (may be empty or generic string for anonymous/complex matches).
 
function extractFunctionNames(text = '') {
    const names = new Set();

    // function declarations: function name(...) { ... }
    const funcDeclRe = /(?:^|\s)function\s+([A-Za-z0-9_$]+)\s*\(/g;
    let m;
    while ((m = funcDeclRe.exec(text))) {
        if (m[1]) names.add(m[1]);
    }

    // named function expressions / arrow functions assigned to const/let/var:
    // const foo = (...) => { ... }  OR  let foo = async (...) => { ... } OR var foo = function(...) { ... }
    const assignRe = /(?:^|\s)(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function\s*\(|\()/g;
    while ((m = assignRe.exec(text))) {
        if (m[1]) names.add(m[1]);
    }

    // ES6 method shorthand in object/class: name(...) { ... } - capture common cases by scanning lines
    const methodRe = /(?:^|\s)([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/g;
    while ((m = methodRe.exec(text))) {
        // filter out control keywords and known constructs
        const name = m[1];
        if (!['if','for','while','switch','catch','function'].includes(name)) {
            names.add(name);
        }
    }

    return names;
}


// Count function names that are present in newText but not in oldText.
 
function detectAddedFunctions(oldText = '', newText = '') {
    const oldSet = extractFunctionNames(oldText);
    const newSet = extractFunctionNames(newText);
    let added = 0;
    for (const n of newSet) {
        if (!oldSet.has(n)) added++;
    }
    return added;
}


 // Handler called from extension on text document changes.
 // Expects a vscode.TextDocumentChangeEvent.
 
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

        // update per-file snapshot
        state.perFile.set(uri, newText);

        // update totals
        state.totals.linesModified += modifiedLines;
        state.totals.functionsAdded += addedFunctions;

        // save in-memory (already in state object). Could persist to globalState later.

        // emit event if threshold reached
        if (state.totals.linesModified >= state.threshold) {
            const payload = {
                totals: { ...state.totals },
                threshold: state.threshold,
            };
            // notify via notifier if available
            try {
                if (notifier && typeof notifier.notify === 'function') {
                    notifier.notify(`Commit reminder: ${state.totals.linesModified} lines modified, ${state.totals.functionsAdded} functions added.`);
                }
            } catch (e) {
                console.error('[tracker] notifier failed', e);
            }
            // emit event for consumers
            emitter.emit('threshold', payload);
            // reset counters after emitting (optional behaviour)
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
    // alias names accepted by extension.js heuristics
    handleChange: onDocumentChange,
    processChange: onDocumentChange,
    // event subscription
    onThreshold: (handler) => emitter.on('threshold', handler),
    // debug / inspect
    _getState: () => state,
};
