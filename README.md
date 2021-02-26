# Choices-AWS-Lambda
Amazon Lambda 内のデータを [Questetra BPM Suite](https://questetra.com/) の「検索セレクトボックス」の外部マスタとして使用するための 
Lambda 関数テンプレートです。

チュートリアル記事は[こちら](https://support.questetra.com/ja/developer-blog/choices-aws-lambda/)。//仮

## 事前準備
以下のものが必要です。
* [Node.js](https://nodejs.org/) / [npm](https://www.npmjs.com/) コマンド


ディレクトリ内で `npm ci` を実行し、必要なパッケージをインストールしておきます（node_modules ディレクトリが作成されます）。

## 使い方
使用するマスタファイルのファイル名を Lambda の環境変数 "FILE_NAME" にセットします。