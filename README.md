# Choices-AWS-Lambda
Amazon Lambda 内のデータを [Questetra BPM Suite](https://questetra.com/) の「検索セレクトボックス」の外部マスタとして使用するための 
Lambda 関数テンプレートです。

チュートリアル記事は[こちら](https://support.questetra.com/ja/developer-blog/choices-aws-lambda/)。//仮

## 事前準備
以下のものが必要です。
* [Node.js](https://nodejs.org/) / [npm](https://www.npmjs.com/) コマンド


使用したい側のディレクトリ内で `npm ci` を実行し、必要なパッケージをインストールしておきます（node_modules ディレクトリが作成されます）。

## 使い方
xml のマスタファイルを使用したい場合は "xml" ディレクトリ、csv/tsv のマスタファイルを使用したい場合は "csv" ディレクトリ内のコードを使用します。

### tsv の場合の設定
csv/index.js の73行目にある `const array = line.split(',');` を `const array = line.split('\t');`に変更します。