# PRの自動チェック

`main`向けのPRを作成・更新したときと、`main`にpushしたときに
GitHub Actionsの`CI`が実行されます。Actions画面から手動実行もできます。
同じPRで新しい実行が始まると、前の実行を中止します。

ルートの`package-lock.json`には、Linuxでのインストールに必要な
oxlint・Tailwind CSS・Lightning CSSのOS別パッケージも含めています。
既存の依存パッケージのバージョンと、Windows用のエントリーは維持しています。

## 確認する内容

- **Frontend checks**（Node.js 24）：ルートの`npm ci`、フロントのlint、
  全単体テスト、ビルド、インフラのTypeScriptビルド。
  lintは警告がある場合も失敗します。
- **Backend unit tests**（Python 3.13）：開発用依存関係のインストールと
  `backend/tests/unit`の全テスト。

フロントはCI専用の仮の環境変数でビルドします。バックエンドはAWSを
モックする単体テストを実行します。AWSへのログイン、認証情報の登録、
デプロイは不要です。CIで作ったフロントのビルド成果物は公開しません。

インフラはコンパイルを確認します。CDKのsynth・diff・deployや、
実環境でのログイン・画面操作はこのCIでは確認しません。

## ローカルでの確認（PowerShell・リポジトリのルート）

Node.js 24と、開発用依存関係をインストール済みのPython 3.13の仮想環境を使います。
フロントのビルドには、通常どおりローカルの`frontend/.env`を用意してください。

```powershell
npm.cmd ci
npm.cmd --prefix frontend run lint -- --deny-warnings
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
npm.cmd --prefix infrastructure run build
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/unit -q
git diff --check
```

## PRでの確認

PRのチェック欄で`Frontend checks`と`Backend unit tests`の両方が成功したことを
確認してください。失敗した場合は、Detailsから該当するステップのログを開けます。

このファイルを追加するだけでは、失敗したPRのマージは禁止されません。
マージ前の成功を必須にするには、初回の実行後にGitHubのルールセットまたは
ブランチ保護で、この2つのチェックを必須に設定してください。
