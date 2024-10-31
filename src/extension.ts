import * as vscode from 'vscode'
import { DjangoSettingsDefinitionProvider } from './definitionProvider'

export function activate(context: vscode.ExtensionContext) {
    const subscription = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', language: 'python' },
        new DjangoSettingsDefinitionProvider(),
    )
    context.subscriptions.push(subscription)
}

export function deactivate() {}
