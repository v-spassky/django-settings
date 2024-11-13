import * as vscode from 'vscode'
import { DjangoSettingsCompletionProvider } from './completionProvider'
import { DjangoSettingsDefinitionProvider } from './definitionProvider'

export function activate(context: vscode.ExtensionContext) {
    const definitionProviderSubscription = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', language: 'python' },
        new DjangoSettingsDefinitionProvider(),
    )
    context.subscriptions.push(definitionProviderSubscription)

    const coompletionProviderSubscription =  vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'python' },
        new DjangoSettingsCompletionProvider(),
        '.',
    )
    context.subscriptions.push(coompletionProviderSubscription)
}

export function deactivate() {}
