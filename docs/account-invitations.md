# 教員からのアカウント招待

## 対応範囲

- 教員ポータルの「アカウント招待」から、生徒・保護者・支援者を個別に招待します。
- 生徒の所属は操作する教員の現在の担当クラスに固定します。
- 保護者・支援者は、担当クラスの生徒を1人選んで紐づけます。生徒の現在の共有設定を適用します。
- 最初の教員登録は管理者が行います。教員をこの画面から作成することはできません。
- CSV一括登録、既存アカウントの所属変更、1つの保護者アカウントへの複数生徒の紐づけは今回の対象外です。

## 招待と初回ログイン

1. 実際に受信できるメールアドレスと名前を入力して招待します。
2. Cognitoが招待メールを送信します。教員画面やDynamoDBにはパスワードを表示・保存しません。
3. 本人は公開サイトのログイン画面に、招待メールを受信したメールアドレスと、仮パスワードを入力します。
4. 初回パスワード設定画面で本人用のパスワードを2回入力します。設定が完了するまで各ポータルには移動しません。
5. 新規生徒には、教員が生徒一覧から学習の現在地も設定してください。

招待メールに内部的なユーザー名が表示された場合も、ログイン画面には受信したメールアドレスを入力してください。
Cognitoのメール送信設定・送信制限によって配信できない場合があります。デプロイ後に受信可能なアドレスで実送信を確認してください。

## 再送と重複防止

- 同じ入力で登録を再試行しても、既存のユーザーID・ロール・紐づけは変更しません。
- 作成ボタンの再試行では、送信済みメールを自動再送しません。明示的な「招待を再送」を使用します。
- 再送は1分以上あけて行います。再送すると以前の仮パスワードは使えなくなります。
- 初回設定済みのアカウントへの再送を拒否します。通常のパスワードを変更する権限は招待用Lambdaに付けていません。
- 送信結果が不明な場合は、受信を確認して必要なときだけ再送してください。
- 処理中に中断された場合、リースの期限（約1分）後に同じ招待の再試行・再送を行えます。
- 別ロール・別生徒・別クラスへのメールアドレスの再利用は拒否します。変更が必要な場合は管理者に依頼してください。
- 招待一覧は担当クラスの最新50件です。過去のseedアカウントなど、招待機能以外で作成したアカウントは含みません。

## デプロイ

`Invitations`テーブル、招待API、フロント画面を追加します。Cognitoには招待アカウントを識別する変更不可の属性`invitation_id`を追加します。既存テーブル・Cognitoプールの置き換えはありません。既存ユーザーの属性値は変更しません。Cognitoの仕様上、このカスタム属性は追加後に削除・定義変更できないため、以降のCDK定義にも保持してください。

```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/unit -q
npm.cmd --prefix frontend run lint -- --deny-warnings
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run build
npm.cmd --prefix infrastructure run build
npm.cmd --prefix infrastructure test -- --runInBand
npm.cmd --prefix infrastructure run cdk -- diff StudyPlatformApiStack --profile school --region ap-northeast-1
```

差分を確認してAPIスタックをデプロイすると、依存するデータスタックの新しいテーブルも作成されます。
その後、ビルド済みのフロントを差分確認・デプロイします。

```powershell
npm.cmd --prefix infrastructure run cdk -- deploy StudyPlatformApiStack --profile school --region ap-northeast-1
npm.cmd --prefix infrastructure run cdk -- diff StudyPlatformFrontendStack --profile school --region ap-northeast-1
npm.cmd --prefix infrastructure run cdk -- deploy StudyPlatformFrontendStack --profile school --region ap-northeast-1
```

## テスト

PythonのテストはMotoを使い、AWSには接続しません。Moto 5.2.4ではRESEND時にユーザーを再作成してしまうため、再送部分だけAWSの契約に合わせたスタブを使用しています。実際の配信・仮パスワードの期限・メール到達は実環境で確認が必要です。
