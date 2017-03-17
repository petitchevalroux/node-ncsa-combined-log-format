# node-ncsa-combined-log-format
A transform stream, converting combined common log format to object

## Usage
```
npm install common-log-format
```

```javascript
var Clf = require("ncsa-combined-log-format");
var stream = require("stream");
var output = new stream.Writable({objectMode:true});
output._write = function(chunk, enc, cb) {
    console.log(chunk);
    cb();
};
var input = new stream.Readable();
var clf = new Clf();
clf.on("error",function(e){
	console.log(e);
});
input.pipe(new Clf()).pipe(output);
input.push("127.0.0.1 logname user [Wed, 11 Jun 2014 15:51:48 GMT] \"GET /package.json HTTP/1.1\" 200 733 \"http://localhost:8000/\" \"userAgent\"\n");
input.push(null);
```
Will output:
```
{ host: '127.0.0.1',
  logName: 'logname',
  user: 'user',
  date: 2014-06-11T15:51:48.000Z,
  request: { method: 'GET', httpVersion: '1.1', uri: '/package.json' },
  statusCode: 200,
  size: 733,
  referer: 'http://localhost:8000/',
  userAgent: 'userAgent' }
```
