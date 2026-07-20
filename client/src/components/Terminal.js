import React, { useEffect, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const Terminal = ({ socket, termId, userId, webcontainer, courseId, onError, localWorkspacePath }) => {
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);
    const shellProcessRef = useRef(null);
    const terminalRef = useRef(null);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    // 1. UI INITIALIZATION (Run ONLY once on mount)
    useEffect(() => {
        if (xtermRef.current) return;

        console.log("[Terminal] Initializing persistent XTerm instance");
        const term = new XTerminal({
            cursorBlink: false,
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
            },
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            allowTransparency: true,
            rows: 20,
            cols: 80,
            convertEol: true
        });

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);

        // First fit
        setTimeout(() => {
            try { fitAddon.fit(); } catch (e) { }
        }, 100);

        xtermRef.current = term;

        // Global access for AI and debugging
        if (!window.ideTerminals) window.ideTerminals = {};
        window.ideTerminals[termId] = term;

        window.getTerminalOutput = (id) => {
            const t = window.ideTerminals[id];
            if (!t) return "";
            const buffer = t.buffer.active;
            let lines = [];
            for (let i = Math.max(0, buffer.cursorY - 20); i <= buffer.cursorY; i++) {
                const line = buffer.getLine(i);
                if (line) lines.push(line.translateToString(true));
            }
            return lines.join('\n');
        };

        // Resize Handling with Debounce for Smoothness
        let resizeTimeout;
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (fitAddonRef.current && xtermRef.current) {
                    try { fitAddonRef.current.fit(); } catch (e) { }
                }
            }, 100); // 100ms debounce
        });
        if (terminalRef.current) resizeObserver.observe(terminalRef.current);

        return () => {
            console.log("[Terminal] Disposing XTerm instance (Unmount)");
            if (window.ideTerminals) delete window.ideTerminals[termId];
            resizeObserver.disconnect();
            term.dispose();
            xtermRef.current = null;
        };
    }, [termId]); // termId is usually stable, but if it changes we reset.

    // 2. SHELL / LOGIC (Run when backend or instances change)
    useEffect(() => {
        const term = xtermRef.current;
        if (!term) return;

        let active = true;
        let inputWriter = null;
        let onDataHandler = null;
        let onResizeHandler = null;

        const startNativeTerminal = async () => {
            if (!localWorkspacePath || !window.electronAPI || !active) return;
            try {
                const res = await window.electronAPI.spawnTerminal(localWorkspacePath);
                if (!res.success) {
                    console.error("[Terminal] Native Shell Load Error:", res.error);
                    return;
                }

                // Listen for data from native terminal
                window.electronAPI.onTerminalData((data) => {
                    if (active) {
                        term.write(data);
                        if (socket) socket.emit('terminal:mirror', { termId, data });
                    }
                });

                // Write data from xterm to native terminal
                onDataHandler = term.onData((data) => {
                    window.electronAPI.terminalWrite(data);
                });

                // Handle resize
                onResizeHandler = term.onResize((size) => {
                    window.electronAPI.terminalResize(size.cols, size.rows);
                });

                console.log("[Terminal] Native Desktop Shell Connected");

                return () => {
                    if (onDataHandler) onDataHandler.dispose();
                    if (onResizeHandler) onResizeHandler.dispose();
                };
            } catch (err) {
                console.error("[Terminal] Native Shell Exception:", err);
            }
        };

        const startShell = async () => {
            if (localWorkspacePath && window.electronAPI) {
                return startNativeTerminal();
            }

            if (!webcontainer || !active) return;
            try {
                const shellProcess = await webcontainer.spawn('jsh', {
                    terminal: { cols: term.cols, rows: term.rows },
                });
                if (!active) { shellProcess.kill(); return; }
                shellProcessRef.current = shellProcess;

                // OPTIMIZED: Buffered writing for smooth rendering
                let buffer = '';
                let timeout;
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write(data) {
                            if (active) {
                                buffer += data;
                                if (!timeout) {
                                    timeout = setTimeout(() => {
                                        term.write(buffer);
                                        if (socket) socket.emit('terminal:mirror', { termId, data: buffer });
                                        
                                        // Error Heuristics on the buffered data
                                        const errorPatterns = [/ReferenceError:/i, /TypeError:/i, /SyntaxError:/i, /npm ERR!/i, /Error:/i, /sh: .*: not found/i, /failed to compile/i];
                                        if (errorPatterns.some(pattern => pattern.test(buffer)) && onErrorRef.current) {
                                            const now = Date.now();
                                            if (!window._lastErrorTime || now - window._lastErrorTime > 2000) {
                                                window._lastErrorTime = now;
                                                onErrorRef.current({ termId, output: buffer, lastCommand: "" });
                                            }
                                        }
                                        buffer = '';
                                        timeout = null;
                                    }, 10); // 10ms batching
                                }
                            }
                        },
                    })
                );

                inputWriter = shellProcess.input.getWriter();
                if (!window.ideTerminalInputs) window.ideTerminalInputs = {};
                window.ideTerminalInputs[termId] = inputWriter;

                onDataHandler = term.onData((data) => {
                    if (inputWriter) inputWriter.write(data);
                });

                onResizeHandler = term.onResize((size) => {
                    if (shellProcess) shellProcess.resize(size);
                });

                console.log("[Terminal] WebContainer Shell Connected");

                return () => {
                    if (onDataHandler) onDataHandler.dispose();
                    if (onResizeHandler) onResizeHandler.dispose();
                    if (window.ideTerminalInputs) delete window.ideTerminalInputs[termId];
                };
            } catch (err) {
                console.error("[Terminal] Shell Load Error:", err);
            }
        };

        const setupSocketFallback = () => {
            if (!socket || webcontainer || (localWorkspacePath && window.electronAPI) || !active) return;

            const handleData = ({ termId: id, data }) => {
                if (id === termId && active) {
                    term.write(data);
                    term.scrollToBottom();
                }
            };

            // Listen to Native Desktop Runtime output
            if (typeof window !== 'undefined' && window.electronAPI) {
                window.electronAPI.onTerminalData((data) => {
                    if (active) {
                        term.write(data);
                        term.scrollToBottom();
                    }
                });
            }

            socket.emit('terminal:create', { termId, userId, courseId });
            socket.on('terminal:data', handleData);
            
            const onConnectHandler = () => {
                socket.emit('terminal:create', { termId, userId, courseId });
            };
            socket.on('connect', onConnectHandler);

            const onDataHandler = term.onData((data) => {
                if (active) socket.emit('terminal:write', { termId, data });
            });
            const onResizeHandler = term.onResize((size) => {
                if (active) socket.emit('terminal:resize', { termId, cols: size.cols, rows: size.rows });
            });

            console.log("[Terminal] Socket-based Terminal Connected");
            
            // Initial explicit fit when connecting
            setTimeout(() => {
                if (fitAddonRef.current) {
                    try { fitAddonRef.current.fit(); } catch(e){}
                }
            }, 300);

            return () => {
                socket.emit('terminal:close', { termId });
                socket.off('terminal:data', handleData);
                socket.off('connect', onConnectHandler);
                onDataHandler.dispose();
                onResizeHandler.dispose();
            };
        };

        let cleanupLogic = null;
        if (localWorkspacePath && window.electronAPI) {
            console.log(`[Terminal] ${termId} Re-initializing in NATIVE DESKTOP mode`);
            term.reset();
            term.write('\x1b[32m[Native Desktop Terminal: Local Shell Connected]\x1b[0m\r\n');
            startShell().then(cleanup => cleanupLogic = cleanup);
        } else if (webcontainer) {
            console.log(`[Terminal] ${termId} Re-initializing in LOCAL (WebContainer) mode`);
            term.reset();
            term.write('\x1b[36m[Local Terminal: WebContainer Connected]\x1b[0m\r\n');
            startShell().then(cleanup => cleanupLogic = cleanup);
        } else if (socket) {
            console.log(`[Terminal] ${termId} Re-initializing in SERVER (PTY) mode`);
            term.reset();
            term.write('\x1b[35m[Server Terminal: PTY Connected]\x1b[0m\r\n');
            cleanupLogic = setupSocketFallback();
        }

        return () => {
            active = false;
            console.log("[Terminal] Cleaning up shell/socket logic");
            if (shellProcessRef.current) {
                shellProcessRef.current.kill();
                shellProcessRef.current = null;
            }
            if (cleanupLogic) cleanupLogic();
        };
    }, [socket, webcontainer, userId, termId, courseId, localWorkspacePath]);

    return (
        <div
            ref={terminalRef}
            className="cyber-terminal"
            onClick={() => { if (xtermRef.current) xtermRef.current.focus(); }}
            style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                overflow: 'hidden',
                padding: '10px'
            }}
        />
    );
}; // Fixed closing brace

export default React.memo(Terminal);