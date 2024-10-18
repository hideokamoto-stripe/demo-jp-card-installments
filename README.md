# Stripe クレジットカード分割払いデモ

Stripeを利用したクレジットカード決済で、分割払いを提供するサンプルアプリです。

## 実装している決済フロー

- ユーザーがクレジットカード番号をフォームに入力
- カード情報の入力が完了すると、アプリがStripe上にデータを送信する
- [分割払いに対応しているクレジットカードの場合] カード番号フォームの下に分割払いプランを選択するUIが表示される
- 注文するボタンをクリックすると、カード決済処理が開始される
- 3Dセキュアによる認証が必要な場合は、UI表示またはリダイレクトが行われる
- 決済が完了すると、決済フォーム下部に支払い金額と分割払い回数が表示される

## デモアプリの実行方法

### セットアップ

```
git clone git@github.com:hideokamoto-stripe/demo-jp-card-installments.git
cd demo-jp-card-installments
npm install
```

### 環境変数の設定

```bash
touch .env
touch .dev.vars
```

**.env**
```
VITE_PUBLIC_STRIPE_PUB_KEY=<pk_test_から始まる公開可能APIキー>
```
**.dev.vars**
```
STRIPE_SECRET_API_KEY=<sk_test_から始まるシークレットキー>
```

### アプリケーションの起動

```bash
npm run dev
```

### Cloudflareへのデプロイ

```
npm run build
npm run deploy
```

Cloudflare Pagesにデプロイを行います。`Wrangler`またはダッシュボードの設定にて`STRIPE_SECRET_API_KEY`を環境変数として登録してください。

## Author

[Hidetaka Okamoto](https://hidetaka.dev)
