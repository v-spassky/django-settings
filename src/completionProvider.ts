import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from './logger'

export class DjangoSettingsCompletionProvider implements vscode.CompletionItemProvider {
    private settingsNames: Map<string, string[]> = new Map()
    private watchers: Map<string, vscode.FileSystemWatcher[]> = new Map()

    constructor() {
        this.loadSettings()
        this.watchSettingsFiles()
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('djangoSettings.settingsFiles')) {
                logger.info('Detected an event that may affect `djangoSettings.settingsFiles`.')
                this.loadSettings()
                this.watchSettingsFiles()
            }
        })
    }

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
    ): vscode.CompletionItem[] | null {
        logger.debug(`Requested completions on ${document.uri.fsPath}:${position.line} (column ${position.character}).`)
        const lineText = document.lineAt(position).text
        const textBeforeCursor = lineText.substring(0, position.character)
        // TODO: infer settings object name instead of hard-coding it).
        if (!textBeforeCursor.endsWith('settings.')) {
            logger.debug('Completion not triggered after `settings.`. No completions provided.')
            return null
        }
        const activeWorkspace = vscode.workspace.getWorkspaceFolder(document.uri)
        if (!activeWorkspace) {
            logger.debug(
                "Could not provide any completions because the dequestng document doesn't match any workspace folder.",
            )
            return null
        }
        const settingsNames = this.settingsNames.get(activeWorkspace.name)
        if (settingsNames === undefined) {
            logger.debug(
                "Could not provide any completions because active workspace doesn't have any previously discovered " +
                    'settings names.',
            )
            return null
        }
        const completions = settingsNames.map((name) => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable)
            // Make the completion appear at the top of the suggetions list.
            item.sortText = '000' + name
            return item
        })
        const completionsRepresentation = completions.map((completion) => completion.label).join(', ')
        logger.debug(`Found such completions: ${completionsRepresentation}.`)
        return completions
    }

    private loadSettings() {
        if (!vscode.workspace.workspaceFolders) {
            logger.warning('Could not load settings definitions because no workspace folder is open.')
            return
        }
        for (const workspaceFolder of vscode.workspace.workspaceFolders) {
            const settingsFiles: string[] = vscode.workspace
                .getConfiguration('djangoSettings', workspaceFolder)
                .get('settingsFiles', [])
            const settingsNamesSet = new Set<string>()
            for (const relativePath of settingsFiles) {
                const settingsFilePath = path.join(workspaceFolder.uri.fsPath, relativePath)
                if (!fs.existsSync(settingsFilePath)) {
                    logger.warning(`Could not find ${settingsFilePath}!`)
                    continue
                }
                const content = fs.readFileSync(settingsFilePath, 'utf-8')
                const settingPattern = /^\s*([\w]+)\s*=\s*/gm
                let match
                while ((match = settingPattern.exec(content)) !== null) {
                    settingsNamesSet.add(match[1])
                }
            }
            this.settingsNames.set(workspaceFolder.name, Array.from(settingsNamesSet))
            const settingsNamesRepresentation = this.settingsNames.get(workspaceFolder.name)!.join(', ')
            logger.debug(
                `Discovered such settings definitions: ${settingsNamesRepresentation} for the ` +
                    `${workspaceFolder.name} workspace.`,
            )
        }
    }

    private watchSettingsFiles() {
        if (!vscode.workspace.workspaceFolders) {
            logger.warning('Could not load settings definitions because no workspace folder is open.')
            return
        }
        for (const workspaceFolder of vscode.workspace.workspaceFolders) {
            const settingsFiles: string[] = vscode.workspace
                .getConfiguration('djangoSettings', workspaceFolder)
                .get('settingsFiles', [])
            this.disposeWorkspaceWatchers(workspaceFolder.name)
            for (const relativePath of settingsFiles) {
                const watcher = vscode.workspace.createFileSystemWatcher(
                    new vscode.RelativePattern(workspaceFolder, relativePath),
                )
                // TODO: don't reload settings from all files, just from changed ones.
                watcher.onDidChange(() => this.loadSettings())
                watcher.onDidCreate(() => this.loadSettings())
                watcher.onDidDelete(() => this.loadSettings())
                if (!this.watchers.has(workspaceFolder.name)) {
                    this.watchers.set(workspaceFolder.name, [])
                }
                this.watchers.get(workspaceFolder.name)!.push(watcher)
            }
            logger.debug(
                `Now there are ${this.watchers.get(workspaceFolder.name)!.length} watcher(s) for the ` +
                    `${workspaceFolder.name} workspace.`,
            )
        }
    }

    private disposeWorkspaceWatchers(workspaceName: string) {
        const watchers = this.watchers.get(workspaceName)
        if (watchers === undefined) {
            logger.debug(
                `Could not dispose file watchers for the ${workspaceName} workspace because it has no registered ` +
                    'watchers.',
            )
            return
        }
        for (const watcher of watchers) {
            watcher.dispose()
        }
        this.watchers.set(workspaceName, [])
    }
}
