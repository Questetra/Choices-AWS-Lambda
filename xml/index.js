const xmlparser = require('xml2json');
const fs = require('fs');
const xmlstream = require('node-xml-stream')
const readline = require("readline");

const file_name = "master/" + process.env.FILE_NAME; //lambda の環境変数から読み出し
const file_type = file_name.substr(-3);

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
    let responseJson;
    if(file_type === "xml"){
      responseJson = await streamXmlRead(file_name, query, parent, values); //ファイル読み込み、完了まで待機
    }else if(file_type === "csv" || file_type === "tsv"){
      responseJson = await streamsvRead(file_name, query, parent, values, file_type); //ファイル読み込み、完了まで待機
    }else{
      throw new Error("Invalid Filetype");
    }
    
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

function streamXmlRead(fileName, query, parent, values) {
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
      // name = 'item'
      // attrs = { value: '01', display: 'display' }
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
      // Stream is completed
      resolve(data);
    });

    parser.on('error', err => {
      // Handle a parsing error
      reject(err);
    });

    // Stream のエラー処理
    stream.on("error", (err) => {
      reject(err);
    });

    stream.pipe(parser);
  })
}

function streamsvRead(fileName, query, parent, values, type) {
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
    let split;
    if(type === "csv"){
      split = ','
    }else{
      //tsv
      split = '\t'
    }
    // readlineにStreamを渡す
    const reader = readline.createInterface({ input: stream });

    reader.on("line", (line) => {
      const array = line.split(split);
      const attrsTmp = {
        value: array[0],
        display: array[1]
      };
      //要件に合うもののみ data に入れる
      if ((query !== "") && (attrsTmp.display.indexOf(query) === -1)) { return; }
      //query が指定されていて、display に query で指定された文字列を含まないならば弾く
      if ((parent !== "") && (!attrsTmp.value.startsWith(parent))) { return; }
      //parent が指定されていて、value が parent で指定された文字列から始まらないならば弾く
      if ((values.length !== 0) && (values.indexOf(attrsTmp.value) === -1)) { return; }
      //value が指定されていて、value が values に含まれる文字列と完全一致しないならば弾く
      data.items.item.push(attrsTmp);
      //上の条件で弾かれなければ data に入れる
    });

    reader.on("close", () => {
      resolve(data);
    });

    // エラー処理
    stream.on("error", (err) => {
      reject(err);
    });
  })
}