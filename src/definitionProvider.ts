import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class DjangoSettingsDefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
    ): vscode.Location[] | null {
        const range = document.getWordRangeAtPosition(position, /settings\.\w+/)
        if (!range) {
            return null
        }
        const settingName = document.getText(range).split('.')[1]
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
        if (!workspaceFolder) {
            return null
        }
        const settingsFiles: string[] = vscode.workspace.getConfiguration().get('djangoSettings.settingsFiles', [])
        const locations: vscode.Location[] = []
        for (const relativeSettingFilePath of settingsFiles) {
            const settingsFilePath = path.join(workspaceFolder.uri.fsPath, relativeSettingFilePath)
            if (!fs.existsSync(settingsFilePath)) {
                // TODO: emit a warning notification.
                continue
            }
            const fileContent = fs.readFileSync(settingsFilePath, 'utf-8')
            const lines = fileContent.split('\n')
            for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
                const line = lines[lineNumber].trim()
                if (line.startsWith(`${settingName} =`)) {
                    const settingUri = vscode.Uri.file(settingsFilePath)
                    const position = new vscode.Position(lineNumber, line.indexOf(settingName))
                    locations.push(new vscode.Location(settingUri, position))
                }
            }
        }
        return locations.length > 0 ? locations : null
    }
}
