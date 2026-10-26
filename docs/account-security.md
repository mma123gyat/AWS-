# アカウントと認証エラーの確認

## 生徒を含む全ロールの現在の権限

認証のGSIはユーザーIDの検索にだけ使い、Users本体を強整合読み取りして
現在のロール・Cognito sub・クラス・紐づく生徒を確認します。
トークンのロールと現在のロールが異なる場合や、削除・sub変更後の古い
検索結果では403を返します。変更したロールを使うにはログインし直してください。

教員と共有設定の追加の権限確認、および書き込み時のトランザクション条件も維持します。

## 新規デモユーザーの作成

`backend/scripts/seed_users.py`に共通の固定パスワードはありません。
新規作成するロールについて、以下の環境変数を設定してください。
Git管理対象外の`backend/.env`にも設定できます。OSの環境変数を優先します。

- `SEED_TEACHER_PASSWORD`
- `SEED_STUDENT_PASSWORD`
- `SEED_PARENT_PASSWORD`
- `SEED_SUPPORT_PASSWORD`

8〜256文字で小文字と数字を含み、空白を含まない値を設定します。
ロールごとに異なる十分に長い値を使ってください。
設定が不足している場合は、そのユーザーをCognitoに作成する前にエラーにします。
パスワードはスクリプトの完了ログに出力しません。

既存ユーザーだけを再利用する場合、これらの環境変数は不要です。
再実行しても既存パスワードとユーザーID、保存済みの学習記録は維持します。

## 既存ユーザーの公開済み初期パスワードを変更する

以前コードに含まれていた初期パスワードは、Gitの履歴にも残っています。
その値を使っている既存ユーザーは、別途新しいパスワードに変更してください。
CDKのデプロイやseedの再実行では変更されません。

このプロジェクトでは、以下をPowerShellで実行できます。`school`のAWS認証が必要です。
対象メールアドレスは変更するユーザーを指定してください。パスワードは画面に表示せず入力します。

```powershell
$poolId = aws cloudformation describe-stacks --stack-name StudyPlatformAuthStack --profile school --region ap-northeast-1 --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue | [0]" --output text --no-cli-pager
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($poolId) -or $poolId -eq 'None') { throw 'UserPoolIdを取得できませんでした。' }
$targetEmail = Read-Host '変更するユーザーのメールアドレス'
$secret = Read-Host '新しいパスワード' -AsSecureString
try {
    $newPassword = [System.Net.NetworkCredential]::new('', $secret).Password
    aws cognito-idp admin-set-user-password --user-pool-id $poolId --username $targetEmail "--password=$newPassword" --permanent --profile school --region ap-northeast-1 --no-cli-pager
    if ($LASTEXITCODE -ne 0) { throw 'パスワードを変更できませんでした。' }
    aws cognito-idp admin-user-global-sign-out --user-pool-id $poolId --username $targetEmail --profile school --region ap-northeast-1 --no-cli-pager
    if ($LASTEXITCODE -ne 0) { throw 'パスワードは変更済みですが、既存セッションを無効化できませんでした。' }
} finally {
    Remove-Variable newPassword, secret -ErrorAction SilentlyContinue
}
```

変更するアカウントごとに実行し、その後アプリでログインを確認してください。
`--permanent`により、現在のログイン画面で未対応の初回パスワード変更ステップを避けます。
グローバルサインアウトで既存セッションの更新も停止します。ただし署名・期限だけで
検証される発行済みJWTは、設定済みの有効期限（最大1時間）まで受け付けられる場合があります。

## API Gatewayの認証エラー

Lambdaの返す応答に加え、API Gateway自身の4xx・5xx応答にもCORSヘッダーと
共通のJSONエラー形式を設定します。HTTPステータスは上書きせず、401・403・429などを保持します。
API Gatewayが返す401と403をブラウザで読み取れるため、フロントの再ログイン・権限エラー表示を使えます。

この変更の反映にはAPIスタックのデプロイが必要です。フロントの変更はありません。
