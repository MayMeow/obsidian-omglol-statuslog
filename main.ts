import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, addIcon, requestUrl } from 'obsidian';

interface MayMeowOmgPublishSettings {
	username: string;
	token: string;
	skip_mastodon_post: boolean;
	default_emoji: string;
}

const DEFAULT_SETTINGS: MayMeowOmgPublishSettings = {
	username: '',
	token: '',
	skip_mastodon_post: false,
	default_emoji: '😀',
}

export default class MayMeowOmgPublishPlugin extends Plugin {
	settings: MayMeowOmgPublishSettings;

	async onload() {
		await this.loadSettings();

		addIcon('face-grin-tears-regular', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor"><path d="M516.1 325.5c1 3 2.1 6 3.3 8.9c3.3 8.1 8.4 18.5 16.5 26.6c3.9 3.9 8.2 7.4 12.7 10.3C506.4 454.8 419.9 512 320 512s-186.4-57.2-228.6-140.6c4.5-2.9 8.7-6.3 12.7-10.3c8.1-8.1 13.2-18.6 16.5-26.6c1.2-2.9 2.3-5.9 3.3-8.9C152.5 406.2 229.5 464 320 464s167.5-57.8 196.1-138.5zM320 48c-101.4 0-185.8 72.5-204.3 168.5c-6.7-3.1-14.3-4.3-22.3-3.1c-6.8 .9-16.2 2.4-26.6 4.4C85.3 94.5 191.6 0 320 0S554.7 94.5 573.2 217.7c-10.3-2-19.8-3.5-26.6-4.4c-8-1.2-15.7 .1-22.3 3.1C505.8 120.5 421.4 48 320 48zM78.5 341.1C60 356.7 32 355.5 14.3 337.7c-18.7-18.7-19.1-48.8-.7-67.2c8.6-8.6 30.1-15.1 50.5-19.6c13-2.8 25.5-4.8 33.9-6c5.4-.8 9.9 3.7 9 9c-3.1 21.5-11.4 70.2-25.5 84.4c-.9 1-1.9 1.8-2.9 2.7zm483 0c-.8-.6-1.5-1.3-2.3-2c-.2-.2-.5-.4-.7-.7c-14.1-14.1-22.5-62.9-25.5-84.4c-.8-5.4 3.7-9.9 9-9c1 .1 2.2 .3 3.3 .5c8.2 1.2 19.2 3 30.6 5.5c20.4 4.4 41.9 10.9 50.5 19.6c18.4 18.4 18 48.5-.7 67.2c-17.7 17.7-45.7 19-64.2 3.4zM439 336.5C414.4 374.6 370.3 400 319.9 400s-94.5-25.4-119.1-63.5c-10.4-16.1 6.8-32.5 25.5-28.1c28.9 6.8 60.5 10.5 93.6 10.5s64.7-3.7 93.6-10.5c18.7-4.4 35.9 12 25.5 28.1zM281.6 228.8l0 0-.2-.2c-.2-.2-.4-.5-.7-.9c-.6-.8-1.6-2-2.8-3.4c-2.5-2.8-6-6.6-10.2-10.3c-8.8-7.8-18.8-14-27.7-14s-18.9 6.2-27.7 14c-4.2 3.7-7.7 7.5-10.2 10.3c-1.2 1.4-2.2 2.6-2.8 3.4c-.3 .4-.6 .7-.7 .9l-.2 .2 0 0 0 0 0 0c-2.1 2.8-5.7 3.9-8.9 2.8s-5.5-4.1-5.5-7.6c0-17.9 6.7-35.6 16.6-48.8c9.8-13 23.9-23.2 39.4-23.2s29.6 10.2 39.4 23.2c9.9 13.2 16.6 30.9 16.6 48.8c0 3.4-2.2 6.5-5.5 7.6s-6.9 0-8.9-2.8l0 0 0 0 0 0zm160 0l0 0 0 0-.2-.2c-.2-.2-.4-.5-.7-.9c-.6-.8-1.6-2-2.8-3.4c-2.5-2.8-6-6.6-10.2-10.3c-8.8-7.8-18.8-14-27.7-14s-18.9 6.2-27.7 14c-4.2 3.7-7.7 7.5-10.2 10.3c-1.2 1.4-2.2 2.6-2.8 3.4c-.3 .4-.6 .7-.7 .9l-.2 .2 0 0 0 0 0 0c-2.1 2.8-5.7 3.9-8.9 2.8s-5.5-4.1-5.5-7.6c0-17.9 6.7-35.6 16.6-48.8c9.8-13 23.9-23.2 39.4-23.2s29.6 10.2 39.4 23.2c9.9 13.2 16.6 30.9 16.6 48.8c0 3.4-2.2 6.5-5.5 7.6s-6.9 0-8.9-2.8l0 0 0 0z"/></svg>');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');


		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'post-to-status-log',
			name: 'Post to status log',
			icon: 'face-grin-tears-regular',

			// allow exectuion only when text is selected
			checkCallback: (checking: boolean) => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (activeView) {
					const editor = activeView.editor;
					if (editor.somethingSelected()) {
						if (!checking) {
							// new Notice('😋 Publishing...');
							this.sendTextToAPI(editor);
						}
						return true;
					}
				}
				return false;
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MayMeowOmgPublishSettingTab(this.app, this));
	}

	// Send text to API
	sendTextToAPI(editor: Editor) {
		let dataToPost = '';
		let selectedText = editor.getSelection();

		// Check if selected text is not empty
		if (selectedText != '') {
			dataToPost = this.getDataToPost(selectedText);
			console.log('Data to post:', dataToPost);

			new Notice('😋 Publishing...');

			requestUrl({
				url: 'https://api.omg.lol/address/' + this.settings.username + '/statuses/',
				method: 'POST',
				body: dataToPost,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + this.settings.token
				}
			})
			.then(response => response.json)
			.then(data => {
				console.log('Success:', data);
				let responseText = '\n>🦣 Discussion: ' + data.response.external_url + '\n>😂 Posted On: ' +  data.response.url;
				
				// text is selected so we can insert after line
				this.insertAfterLine(editor, responseText);

				new Notice('🎉 Published!');
			}).catch((error) =>  {
				console.error('Error:', error);
				new Notice('🤔 Something went wrong!');
			});
		} else {
			new Notice('😋 Nothing selected!');
		}
	}

	// Prepare data to post to API
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
				"emoji": emojis[0],
				"skip_mastodon_post": this.settings.skip_mastodon_post
			})
		}

		return JSON.stringify({
			"emoji": this.settings.default_emoji,
			"content": selectedText,
			"skip_mastodon_post": this.settings.skip_mastodon_post
		})
	}

	// Insert into new line right after selected text
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


class MayMeowOmgPublishSettingTab extends PluginSettingTab {
	plugin: MayMeowOmgPublishPlugin;

	constructor(app: App, plugin: MayMeowOmgPublishPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Username')
			.setDesc('Your omg.lol username (address)')
			.addText(text => text
				.setPlaceholder('Enter your username')
				.setValue(this.plugin.settings.username)
				.onChange(async (value) => {
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
					console.log('Writing username ...');
				}));

		new Setting(containerEl)
			.setName('API Token')
			.setDesc('Your omg.lol API Token')
			.addText(text => text
				.setPlaceholder('Enter your token')
				.setValue(this.plugin.settings.token)
				.onChange(async (value) => {
					this.plugin.settings.token = value;
					await this.plugin.saveSettings();
					console.log('Writing token ...');
				}).inputEl.type = 'password');

		new Setting(containerEl)
			.setName('Default Emoji')
			.setDesc('If your text does not contain emoni on the start this will be used as instead.')
			.addText(text => text
				.setPlaceholder('Enter your emoji')
				.setValue(this.plugin.settings.default_emoji)
				.onChange(async (value) => {
					this.plugin.settings.default_emoji = value;
					await this.plugin.saveSettings();
					console.log('Writing emoji ...');
				}));

		new Setting(containerEl)
			.setName('Skip Mastodon post?')
			.setDesc('If it is enabled, your post will not be posted to Mastodon.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.skip_mastodon_post)
					.onChange((value) => {
						this.plugin.settings.skip_mastodon_post = value;
						this.plugin.saveSettings();
					})
				);

		containerEl.createEl('legend', { text: 'All settings are saved automatically.' });

		// add element with kofi link
		// [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/D1D5DMOTA)

		new Setting(this.containerEl)
            .setName('Sponsor')
            .setDesc('Enjoying this plugin? 💜 Support me on kofi! 😊☕')
            .addButton(button =>
				button.buttonEl.createEl(
					'a',
					{
						text: '☕ Buy me a coffee', //put image here
						href: 'https://ko-fi.com/D1D5DMOTA',
					}
				)

            )
	}
}
