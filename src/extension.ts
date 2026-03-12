import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import Anthropic from '@anthropic-ai/sdk';
import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';

const REPORT_TEMPLATE = `# 📊 Git Diff Report: \`{{FROM_TAG}}\` → \`{{TO_TAG}}\`

> **Generated:** {{DATE}}
> **Repository:** {{REPO}}
> **Language:** {{LANG}}

---

## 🗂️ At a Glance

| Metric | Value |
|--------|-------|
| Total files changed | _fill_ |
| Lines added | _fill_ |
| Lines removed | _fill_ |
| Net change | _fill_ |
| Commits in range | _fill_ |

\`\`\`
Files changed:  ████████░░░░░░░░  _X_ files
Lines added:    ████████████░░░░  +_X_
Lines removed:  ████░░░░░░░░░░░░  -_X_
\`\`\`

---

## 📋 Executive Summary

<!-- 3-4 sentences: what changed, why it matters, overall risk -->

---

## 📁 Changed Files

<!-- Group files by module/folder. For each group: -->

### \`path/to/module\`

| File | Change Type | Summary |
|------|-------------|---------|
| \`filename.ts\` | Modified / Added / Deleted | Brief description |

---

## 🔍 Key Changes

<!-- For each significant change, one subsection: -->

### Feature / Fix Name

**What changed:** ...
**Why it matters:** ...
**Files affected:** \`file1.ts\`, \`file2.ts\`

---

## ⚠️ Breaking Changes

<!-- List anything that changes public APIs, interfaces, config, or behavior -->
<!-- If none, write: ✅ No breaking changes detected -->

---

## 🔒 Security & Risk

| Area | Risk Level | Notes |
|------|-----------|-------|
| API changes | 🟢 Low / 🟡 Medium / 🔴 High | ... |
| Data handling | 🟢 Low / 🟡 Medium / 🔴 High | ... |
| Dependencies | 🟢 Low / 🟡 Medium / 🔴 High | ... |
| Overall | 🟢 Low / 🟡 Medium / 🔴 High | ... |

---

## 🧪 Testing Recommendations

<!-- What should be tested as a result of these changes? -->

- [ ] ...
- [ ] ...

---

## 📝 Notes & Observations

<!-- Anything else worth flagging: tech debt, follow-up tasks, oddities -->
`;

async function buildClient(
  config: vscode.WorkspaceConfiguration,
  secrets: vscode.SecretStorage
) {
  const provider = config.get<string>('provider') ?? 'anthropic';

  if (provider === 'bedrock') {
    const profile = config.get<string>('awsProfile') ?? 'default';
    const region = config.get<string>('awsRegion') ?? 'us-east-2';
    process.env.AWS_PROFILE = profile;
    return new AnthropicBedrock({ awsRegion: region });
  }

  const apiKey = await secrets.get('gitDiffAiReport.anthropicApiKey');
  if (!apiKey) {
    throw new Error('Anthropic API key not set. Run "Git Diff: Configure API Keys" first.');
  }
  return new Anthropic({ apiKey });
}

async function getTags(git: ReturnType<typeof simpleGit>): Promise<[string, string] | null> {
  const tagsResult = await git.tags();
  const tags = tagsResult.all;

  if (tags.length < 2) {
    vscode.window.showErrorMessage('Need at least 2 git tags in this repository.');
    return null;
  }

  const fromTag = await vscode.window.showQuickPick(tags, {
    title: 'Select FROM tag',
    placeHolder: 'Older tag'
  });
  if (!fromTag) {return null;}

  const toTag = await vscode.window.showQuickPick(
    tags.filter(t => t !== fromTag),
    {
      title: 'Select TO tag',
      placeHolder: 'Newer tag'
    }
  );
  if (!toTag) {return null;}

  return [fromTag, toTag];
}

export function activate(context: vscode.ExtensionContext) {

  // Command 1: Configure API keys
  const configureCmd = vscode.commands.registerCommand(
    'git-diff-ai-report.configure',
    async () => {
      const config = vscode.workspace.getConfiguration('gitDiffAiReport');
      const provider = config.get<string>('provider') ?? 'anthropic';

      if (provider === 'anthropic') {
        const key = await vscode.window.showInputBox({
          prompt: 'Enter your Anthropic API key',
          password: true,
          placeHolder: 'sk-ant-...'
        });
        if (key) {
          await context.secrets.store('gitDiffAiReport.anthropicApiKey', key);
          vscode.window.showInformationMessage('Anthropic API key saved.');
        }
      } else {
        // For bedrock, credentials come from AWS profile - just confirm the profile name
        const profile = await vscode.window.showInputBox({
          prompt: 'Enter AWS profile name',
          value: config.get<string>('awsProfile') ?? 'default'
        });
        if (profile) {
          await config.update('awsProfile', profile, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`AWS profile set to: ${profile}`);
        }
      }
    }
  );

  // Command 2: Generate report
  const generateCmd = vscode.commands.registerCommand(
    'git-diff-ai-report.generateReport',
    async () => {
      // Get workspace root
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
      }

      const git = simpleGit(workspaceRoot);

      // Check it's a git repo
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        vscode.window.showErrorMessage('Current workspace is not a git repository.');
        return;
      }

      // Pick tags
      const tags = await getTags(git);
      if (!tags) {return;}
      const [fromTag, toTag] = tags;

      // Build client
      const config = vscode.workspace.getConfiguration('gitDiffAiReport');
      let client: Anthropic | AnthropicBedrock;
      try {
        client = await buildClient(config, context.secrets);
      } catch (e: any) {
        vscode.window.showErrorMessage(e.message);
        return;
      }

      // Run with progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Generating diff report ${fromTag} → ${toTag}...`,
          cancellable: false
        },
        async () => {
          // Get diff
          const diff = await git.diff([`${fromTag}..${toTag}`]);
          const stat = await git.diff([`${fromTag}..${toTag}`, '--stat']);
          const lang = config.get<string>('reportLanguage') ?? 'English';
						
          // Build the filled template header
					const filledTemplate = REPORT_TEMPLATE
						.replace('{{FROM_TAG}}', fromTag)
						.replace('{{TO_TAG}}', toTag)
						.replace('{{DATE}}', new Date().toISOString().split('T')[0])
						.replace('{{REPO}}', workspaceRoot.split(/[\\/]/).pop() ?? 'unknown')
						.replace('{{LANG}}', lang);

					const prompt = `You are a senior engineer writing a technical changelog report.
					Analyze the git diff below and fill in the following Markdown template in ${lang}.

					Rules:
					- Fill in ALL sections — never leave placeholder text like "_fill_" or "..."
					- For the "At a Glance" table, extract exact numbers from the diff stat
					- For the ASCII bar chart, scale bars proportionally (16 chars wide, use █ and ░)
						Example: if 120 lines added and 40 removed, added bar is fuller than removed
					- Group files by directory in the Changed Files section
					- Be concise and technical, avoid filler language
					- Risk levels: 🟢 Low / 🟡 Medium / 🔴 High
					- Testing recommendations should be specific to the actual changes
					- Output ONLY the filled Markdown, no preamble or explanation

					--- TEMPLATE ---
					${filledTemplate}

					--- DIFF STAT ---
					${stat}

					--- DIFF ---
					${diff}`;

					// Read model settings
					const modelId = config.get<string>('modelId') ?? 'claude-sonnet-4-20250514';
					const maxTokens = config.get<number>('maxTokens') ?? 4096;

					const response = await (client as Anthropic).messages.create({
						model: modelId,
						max_tokens: maxTokens,
						messages: [{ role: 'user', content: prompt }]
					});

          const report = (response.content[0] as any).text;

          // Open in new editor tab
          const doc = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
          });
          await vscode.window.showTextDocument(doc, {
            viewColumn: vscode.ViewColumn.Beside
          });
        }
      );
    }
  );

  context.subscriptions.push(configureCmd, generateCmd);
}

export function deactivate() {}