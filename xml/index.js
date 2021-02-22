const xmlparser = require('xml2json');
const fs = require('fs');
const xmlstream = require('node-xml-stream')

exports.handler = async (event) => {
  console.log("Starting ...");
  let query = "";
  let parent = "";
  if (event.queryStringParameters) {
    if (event.queryStringParameters.query) {
      query = event.queryStringParameters.query;
    }
    if (event.queryStringParameters.parent) {
      parent = event.queryStringParameters.parent;
    }
  }
  let values = [];
  if (event.multiValueQueryStringParameters && event.multiValueQueryStringParameters.values) {
    values = event.multiValueQueryStringParameters.values;
  }

  try {
    const responseJson = await streamFileRead('choice.xml', query, parent, values);  //'choice.xml' の部分で読み込むファイル名を指定
    //ファイル読み込み、完了まで待機
    const responseXml = xmlparser.toXml(responseJson)
    return formatResponse(responseXml);
  } catch (e) {
    console.log(e);
    return formatError(e);
  }
};

function formatResponse(body) {
  const response = {
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/xml; charset=utf-8"
    },
    "isBase64Encoded": false,
    "body": body,
  };
  return response;
}

function formatError(error) {
  const response = {
    "statusCode": error.statusCode,
    "headers": {
      "Content-Type": "text/plain; charset=utf-8",
      "x-amzn-ErrorType": error.code
    },
    "isBase64Encoded": false,
    "body": error.code + ": " + error.message
  };
  return response;
}

function streamFileRead(fileName, query, parent, values) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(fileName, {
      encoding: "utf8",         // 文字コード
      highWaterMark: 1024       // 一度に取得する byte 数
    });
    const data = {
      items: {
        item: []
      }
    };// 読み込んだデータ
    const parser = new xmlstream(); //XML のパーサー

    parser.on('opentag', (name, attrs) => {
      if (name === 'item') {
        const attrsTmp = {
          value: attrs.value,
          display: attrs.display.slice(0, -2)
        }//display の最後に' /'が含まれてしまうため取り除く
        //要件に合うもののみ data に入れる
        if ((query !== "") && (attrsTmp.display.indexOf(query) === -1)) {return;}
        //query が指定されていて、display に query で指定された文字列を含まないならば弾く
        if ((parent !== "") && (!attrsTmp.value.startsWith(parent))) {return;}
        //parent が指定されていて、value が parent で指定された文字列から始まらないならば弾く
        if ((values.length !== 0) && (values.indexOf(attrsTmp.value) === -1)) {return;}
        //value が指定されていて、value が values に含まれる文字列と完全一致しないならば弾く
        data.items.item.push(attrsTmp);
        //上の条件で弾かれなければ data に入れる
      }
    });

    parser.on('finish', () => {
      // 読み込み終了時
      resolve(data);
    });

    parser.on('error', err => {
      // parser でエラー発生時
      reject(err);
    });

    // Stream のエラー処理
    stream.on("error", err => {
      reject(err);
    });

    stream.pipe(parser);
  })
}