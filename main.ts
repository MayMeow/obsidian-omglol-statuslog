import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	username: string;
	token: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	username: 'default',
	token: ''
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Post to status log 🤣',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());

				this.sendTextToAPI();
				// editor.replaceSelection('Sample Editor Command' + this.loadTextFromFile());
				// editor.replaceSelection('https://omg.maymeow.lol/' + this.settings.username + '/' + this.settings.token + '/statuslog');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	// load content from current file
	loadTextFromFile() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			const editor = activeView.editor;
			if (editor.somethingSelected()) {
			const selectedText = editor.getSelection();
			console.log('Selected text:', selectedText);
			// Do something with the selected text
			return selectedText;
			} else {
				const currentText = editor.getValue();
				console.log('Current text:', currentText);
				// Do something with the current text
				return currentText;
			}
		}
	}

	sendTextToAPI() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		let selectedText = '';
		let dataToPost = '';

		if (activeView) {
			const editor = activeView.editor;
			if (editor.somethingSelected()) {
			selectedText = editor.getSelection();
			console.log('Selected text:', selectedText);
			// Do something with the selected text
			} else {
				const currentText = editor.getValue();
				console.log('Current text:', currentText);
				// Do something with the current text
				selectedText = currentText;
			}

			dataToPost = this.getDataToPost(selectedText);
			console.log('Data to post:', dataToPost);

			fetch('https://api.omg.lol/address/' + this.settings.username + '/statuses/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + this.settings.token
				},
				body: dataToPost
			})
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
				let responseText = '\n> 🦣 Discussion: ' + data.response.external_url + '\n> 😂 Posted On: ' +  data.response.url;

				if (editor.somethingSelected()) {
					this.insertAfterLine(editor, responseText);
				} else {
					editor.replaceSelection(responseText);
				}

			})
		}

	}

	// data to post
	getDataToPost(selectedText: string)
	{
		selectedText = selectedText.trim();
		const emojiRegex = /^(\p{Emoji}+)/u;
		const isEmoji = emojiRegex.test(selectedText);

		const emojis = selectedText.match(emojiRegex);

		if (isEmoji && emojis != null) {
			selectedText = selectedText.replace(emojiRegex, '');
			selectedText = selectedText.trim();

			return JSON.stringify({
				"content": selectedText,
				"emoji": emojis[0]
			})
		}

		return JSON.stringify({
			"content": selectedText
		})
	}

	insertAfterLine(editor: Editor, textToInsert: string) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		const pos = {line: cursor.line, ch: line.length};
		editor.replaceRange(textToInsert, pos);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Statuslog settings' });

		new Setting(containerEl)
			.setName('Username')
			.setDesc('Your omg.lol username')
			.addText(text => text
				.setPlaceholder('Enter your username')
				.setValue(this.plugin.settings.username)
				.onChange(async (value) => {
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
					console.log('Writing username ...');
				}));

		new Setting(containerEl)
			.setName('Password')
			.setDesc('Your omg.lol password')
			.addText(text => text
				.setPlaceholder('Enter your password')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
					console.log('Writing token ...');
				}).inputEl.type = 'password');
	}
}
