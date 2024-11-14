import * as vscode from 'vscode'
import { DjangoSettingsCompletionProvider } from './completionProvider'
import { DjangoSettingsDefinitionProvider } from './definitionProvider'
import { logger } from './logger'

export function activate(context: vscode.ExtensionContext) {
    logger.info('Activation started...')

    const definitionProviderSubscription = vscode.languages.registerDefinitionProvider(
        { scheme: 'file', language: 'python' },
        new DjangoSettingsDefinitionProvider(),
    )
    context.subscriptions.push(definitionProviderSubscription)

    const coompletionProviderSubscription = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'python' },
        new DjangoSettingsCompletionProvider(),
        '.',
    )
    context.subscriptions.push(coompletionProviderSubscription)

    logger.info('Activated.')
}

export function deactivate() {
    logger.info('Deactivated.')
}
