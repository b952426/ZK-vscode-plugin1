import * as vscode from 'vscode';
import { XmlSchemaPropertiesArray } from './types';
import XmlSimpleParser from './helpers/xmlsimpleparser';

export default class XmlDefinitionProvider implements vscode.DefinitionProvider {
    private documentListener: vscode.Disposable;
    fileUri: String;
    textDocument: vscode.TextDocument;

    constructor(protected extensionContext: vscode.ExtensionContext, protected schemaPropertiesArray: XmlSchemaPropertiesArray) {
    }
    public dispose(): void {
        this.documentListener.dispose();
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async provideDefinition(textDocument: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
        const documentContent = textDocument.getText();
        const offset = textDocument.offsetAt(position);
        const scope = await XmlSimpleParser.getScopeForPosition(documentContent, offset);
        if (token.isCancellationRequested) return [];

        const wordRange = textDocument.getWordRangeAtPosition(position, /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\<\>\/\?\s]+)/g);
        const word = textDocument.getText(wordRange);

        if (scope.context == 'link') {
            const activeTextEditor = vscode.window.activeTextEditor;
            if (activeTextEditor) {
                const editorPath = activeTextEditor.document.uri.path,
                    src = editorPath.indexOf('/src/'),
                    workspaceFolders = vscode.workspace.workspaceFolders,
                    filePath = word.replace(/\./g, "/") + '.java';
                if (src != -1)
                    this.fileUri = editorPath.substring(0, src) + '/src/' + filePath;
                else if (workspaceFolders) this.fileUri = workspaceFolders[0].uri.path + '/' + filePath;
            }
            this.documentListener = vscode.window.onDidChangeTextEditorSelection(() =>
                this.openFile(this.fileUri));
        }
    }
    private async openFile(uri) {
        if (uri) {
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(uri));
            this.fileUri = '';
        }
    }
}