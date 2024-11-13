import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class DjangoSettingsCompletionProvider implements vscode.CompletionItemProvider {
    private settingsNames: string[] = []
    private watchers: vscode.FileSystemWatcher[] = []

    constructor() {
        this.loadSettings()
        this.watchSettingsFiles()
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('djangoSettings.settingsFiles')) {
                this.loadSettings()
                this.watchSettingsFiles()
            }
        })
    }

    private loadSettings() {
        const currentDocumentUri = vscode.window.activeTextEditor?.document.uri
        if (!currentDocumentUri) {
            return
        }
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentDocumentUri)
        if (!workspaceFolder) {
            return
        }
        const settingsFiles: string[] = vscode.workspace.getConfiguration().get('djangoSettings.settingsFiles', [])
        const settingsNamesSet = new Set<string>()
        for (const relativePath of settingsFiles) {
            const settingsFilePath = path.join(workspaceFolder.uri.fsPath, relativePath)
            if (!fs.existsSync(settingsFilePath)) {
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
    }

    private watchSettingsFiles() {
        const currentDocumentUri = vscode.window.activeTextEditor?.document.uri
        if (!currentDocumentUri) {
            return
        }
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentDocumentUri)
        if (!workspaceFolder) {
            return
        }
        const settingsFiles: string[] = vscode.workspace.getConfiguration().get('djangoSettings.settingsFiles', [])
        this.disposeWatchers()
        for (const relativePath of settingsFiles) {
            const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspaceFolder, relativePath))
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

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
    ): vscode.CompletionItem[] {
        return this.settingsNames.map(name => {
            const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable)
            // Make the completion appear at the top of the suggetions list.
            item.sortText = '000' + name
            return item
        })
    }
}
