import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from './logger'

export class DjangoSettingsCompletionProvider implements vscode.CompletionItemProvider {
    private settingsNames: string[] = []
    private watchers: vscode.FileSystemWatcher[] = []

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
        if (!textBeforeCursor.endsWith('settings.')) {
            logger.debug('Completion not triggered after `settings.`. No completions provided.')
            return null
        }
        const completions = this.settingsNames.map((name) => {
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
        logger.debug(`Going to (re)discover settings definitions....`)
        const currentDocumentUri = vscode.window.activeTextEditor?.document.uri
        if (!currentDocumentUri) {
            logger.warning('Could not load settings definitions because there is no currently active editor.')
            return
        }
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentDocumentUri)
        if (!workspaceFolder) {
            logger.warning(
                "Could not load settings definitions because currently active editor's document doesn't match any " +
                    'workspace folder.',
            )
            return
        }
        const settingsFiles: string[] = vscode.workspace.getConfiguration().get('djangoSettings.settingsFiles', [])
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
        this.settingsNames = Array.from(settingsNamesSet)
        const settingsNamesRepresentation = this.settingsNames.join(', ')
        logger.debug(`Discovered such settings definitions: ${settingsNamesRepresentation}.`)
    }

    private watchSettingsFiles() {
        const currentDocumentUri = vscode.window.activeTextEditor?.document.uri
        if (!currentDocumentUri) {
            logger.warning('Could not load settings definitions because there is no currently active editor.')
            return
        }
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentDocumentUri)
        if (!workspaceFolder) {
            logger.warning(
                "Could not load settings definitions because currently active editor's document doesn't match any " +
                    'workspace folder.',
            )
            return
        }
        const settingsFiles: string[] = vscode.workspace.getConfiguration().get('djangoSettings.settingsFiles', [])
        this.disposeWatchers()
        for (const relativePath of settingsFiles) {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(workspaceFolder, relativePath),
            )
            watcher.onDidChange(() => this.loadSettings())
            watcher.onDidCreate(() => this.loadSettings())
            watcher.onDidDelete(() => this.loadSettings())
            this.watchers.push(watcher)
        }
    }

    private disposeWatchers() {
        for (const watcher of this.watchers) {
            watcher.dispose()
        }
        this.watchers = []
    }
}
