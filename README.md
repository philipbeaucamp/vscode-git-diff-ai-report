# 🔍 Git Diff AI Report

> Generate beautiful, structured AI-powered changelog reports from git diffs — directly inside VS Code.

![VS Code](https://img.shields.io/badge/VS%20Code-1.110+-blue?logo=visualstudiocode)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Pick any two git tags** and get a full Markdown report in seconds
- **Structured report** with summary, changed files, key changes, breaking changes, risk assessment and testing recommendations
- **AI-powered** via Anthropic Claude — choose between direct Anthropic API or AWS Bedrock
- **Configurable** — set your model, language, and token limits
- **Opens inline** in VS Code beside your editor as a Markdown document

---

## 📋 Example Output

```
# 📊 Git Diff Report: `v1.2.0` → `v1.3.0`

## 🗂️ At a Glance
| Metric        | Value  |
|---------------|--------|
| Files changed | 8      |
| Lines added   | +142   |
| Lines removed | -37    |

## 📋 Executive Summary
This release introduces JWT-based authentication, refactors the user service
for better separation of concerns, and removes the deprecated v1 API endpoints.

## ⚠️ Breaking Changes
- `GET /api/v1/users` has been removed — migrate to `GET /api/v2/users`
...
```

---

## 🚀 Getting Started

### Prerequisites

- VS Code 1.110+
- Git installed and available in your PATH
- Either an **Anthropic API key** or **AWS credentials with Bedrock access**

### Installation

Install from the [VS Code Marketplace](#) or search for `git-diff-ai-report` in the Extensions panel (`Ctrl+Shift+X`).

---

## ⚙️ Configuration

Open settings via `Ctrl+Shift+P → Git Diff: Open Settings` or navigate to **File → Preferences → Settings** and search for `gitDiffAiReport`.

| Setting | Default | Description |
|---------|---------|-------------|
| `gitDiffAiReport.provider` | `anthropic` | AI provider: `anthropic` or `bedrock` |
| `gitDiffAiReport.modelId` | `claude-sonnet-4-20250514` | Model ID to use |
| `gitDiffAiReport.maxTokens` | `4096` | Maximum tokens for the AI response |
| `gitDiffAiReport.reportLanguage` | `English` | Language for the generated report |
| `gitDiffAiReport.awsProfile` | `default` | AWS profile name (Bedrock only) |
| `gitDiffAiReport.awsRegion` | `us-east-1` | AWS region (Bedrock only) |

---

## 🔑 Setting Up Credentials

### Option A — Anthropic API (Direct)

1. Get your API key from [console.anthropic.com](https://console.anthropic.com)
2. Run `Ctrl+Shift+P → Git Diff: Configure API Keys`
3. Paste your key when prompted — it is stored securely in VS Code's secret storage, never in plain settings

### Option B — AWS Bedrock

> **⚠️ AWS Bedrock Prerequisites — Read carefully**
>
> Before using this extension with AWS Bedrock, you must have:
>
> 1. **AWS credentials configured locally** in `~/.aws/credentials` (Windows: `C:\Users\<you>\.aws\credentials`).
>    Your credentials file should look like this:
>    ```ini
>    [default]
>    aws_access_key_id = AKIA...
>    aws_secret_access_key = ...
>
>    [my-work-profile]
>    aws_access_key_id = AKIA...
>    aws_secret_access_key = ...
>    ```
>
> 2. **Bedrock model access enabled** in your AWS account.
>    Go to **AWS Console → Bedrock → Model access** and request access to the Claude model you want to use.
>    Without this step, all requests will return a `403 AccessDeniedException` error.
>
> 3. **The correct region set** — Bedrock model availability varies by region.
>    Check the [AWS Bedrock model availability page](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) to confirm your chosen model is available in your region.

**Setup steps:**

1. Set `gitDiffAiReport.provider` to `bedrock` in settings
2. Set `gitDiffAiReport.awsProfile` to your profile name (e.g. `my-work-profile`)
3. Set `gitDiffAiReport.awsRegion` to your region (e.g. `us-east-1`)
4. Set `gitDiffAiReport.modelId` to the Bedrock model ID, e.g.:
   ```
   us.anthropic.claude-sonnet-4-5-20251001-v1:0
   ```
   > **Note:** Bedrock model IDs use the format `us.anthropic.<model-name>-v<version>:0`.
   > Always verify the exact ID in your **AWS Console → Bedrock → Model catalog**
   > as these strings change with new model releases.

---

## 🛠️ Usage

1. Open a folder in VS Code that contains a git repository with at least **2 tags**
2. Run `Ctrl+Shift+P → Git Diff: Generate AI Report`
3. Select your **FROM** tag (older)
4. Select your **TO** tag (newer)
5. Wait a few seconds — the report opens in a new tab beside your editor

---

## 💡 Tips

- **Large diffs:** If your diff is very large, consider increasing `maxTokens` or using a model with a larger context window
- **Language:** Set `reportLanguage` to any language (e.g. `Japanese`, `German`) and the report will be generated in that language
- **Scoping:** For monorepos, you can filter by path — this feature is coming in a future release

---

## 🗺️ Roadmap

- [ ] Path filtering for monorepos (like the original `FILTER` env var)
- [ ] Save report directly to file (`CHANGELOG-v1.0.0-v1.1.0.md`)
- [ ] Webview with rendered charts for diff statistics
- [ ] Support for commit range (SHA) in addition to tags

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](#).

---

## 📄 License

MIT