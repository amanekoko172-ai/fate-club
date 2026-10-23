# Fateくらぶ 公開用サイト

このフォルダーは、静的サイトとして公開するための一式です。トップページは `index.html` です。記事ページと `images` フォルダーも同じ場所に置いたまま公開してください。

GitHub Pages などの静的ホスティングにそのまま配置できます。フォルダーを公開したあと、サイト設定で Pages の公開元を `main` ブランチのルートに設定します。

## コメント欄（GitHub Pages + Netlify）

GitHub Pages に投稿フォームを表示し、Netlify のフォーム処理と Functions でコメントを保存します。名前は任意で、投稿は管理画面で確認してから掲載します。承認済みコメントは Netlify の読み取り API から記事ページに表示されます。GitHub アカウントは不要です。

コメント用 Netlify サイトは [symphonious-griffin-6489ff.netlify.app](https://symphonious-griffin-6489ff.netlify.app/) です。管理画面は [コメント管理](https://symphonious-griffin-6489ff.netlify.app/comments-admin.html) です。Netlify Identity と Forms の検出を有効にしてください。投稿の保存には Netlify Blobs を使います。

公開時は GitHub Pages の `main` ブランチにこの変更を反映し、同じ Netlify サイトにもこのリポジトリの最新版をデプロイしてください。Netlify 側のデプロイ完了後、記事ページで名前なしのテスト投稿を行い、管理画面で承認してから記事に表示されることを確認します。独自ドメインを GitHub Pages に設定する場合は、`netlify/functions/article-comments.mjs` の許可オリジンと `comment-thanks.html` の送信先もそのドメインに合わせてください。

既存の `poison` と `tenoch` のコメント保存キーは維持しています。おすすめ欄は固定表示で、月間閲覧数ランキングではありません。

## 閲覧数の計測（Google Analytics 4）

全ページで `analytics.js` を読み込みます。GA4 プロパティ「Fateくらぶ」とウェブデータストリームを作成し、ページビュー計測を設定しました。拡張計測機能は無効にし、標準のページビューだけを計測します。

GitHub Pages に公開すると計測が始まります。Google Analytics の「リアルタイム」レポートで受信を確認できます。通常のレポートへの反映には時間がかかる場合があります。

閲覧データは Google Analytics のログイン画面で確認できます。現在、GA4 アカウントのアクセス権は本人の Google アカウントだけです。サイト上には閲覧数を表示しません。

測定 ID は公開ページのコードに含まれますが、レポートを閲覧する権限とは別です。測定 ID だけで閲覧データや Google Analytics の管理画面にアクセスすることはできません。
