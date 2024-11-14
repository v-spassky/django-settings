import * as vscode from 'vscode'

enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
}

class Logger {
    private outputChannel: vscode.OutputChannel

    constructor(channelName: string) {
        this.outputChannel = vscode.window.createOutputChannel(channelName)
    }

    public debug(message: string) {
        this.log(LogLevel.DEBUG, message)
    }

    public info(message: string) {
        this.log(LogLevel.INFO, message)
    }

    public warning(message: string) {
        this.log(LogLevel.WARNING, message)
    }

    public error(message: string) {
        this.log(LogLevel.ERROR, message)
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString()
        return `${timestamp} [${level}] ${message}`
    }

    private log(level: LogLevel, message: string) {
        const formattedMessage = this.formatMessage(level, message)
        this.outputChannel.appendLine(formattedMessage)
    }
}

export const logger = new Logger('Django settings')
