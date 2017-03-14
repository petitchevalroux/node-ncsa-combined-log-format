"use strict";
var path = require("path");
var Clf = require(path.join(".."));
var Promise = require("bluebird");
var assert = require("assert");
describe("Transform stream", function() {
    var transform;
    beforeEach(function() {
        transform = new Clf();
    });

    function checkResult(entry, result) {
        return new Promise(function(resolve, reject) {
            transform.on("readable", function() {
                try {
                    assert.deepEqual(result, this.read());
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
            transform.write(entry);
        });
    }
    it("Parse a combined log line", function() {
        var p = checkResult(
            "127.0.0.1 logname user [Wed, 11 Jun 2014 15:51:48 GMT] \"GET /package.json HTTP/1.1\" 200 733 \"http://localhost:8000/\" \"userAgent\"", {
                "host": "127.0.0.1",
                "logName": "logname",
                "referer": "http://localhost:8000/",
                "date": new Date(
                    "Wed, 11 Jun 2014 15:51:48 GMT"),
                "request": {
                    "method": "GET",
                    "uri": "/package.json",
                    "httpVersion": "1.1"
                },
                "size": 733,
                "statusCode": 200,
                "user": "user",
                "userAgent": "userAgent"
            });
        return p;
    });

    it("Transform empty value to empty string", function() {
        var p = checkResult(
            "127.0.0.1 - - [Wed, 11 Jun 2014 15:51:48 GMT] \"GET /package.json HTTP/1.1\" 200 733 \"-\" \"-\"", {
                "host": "127.0.0.1",
                "logName": "",
                "referer": "",
                "date": new Date(
                    "Wed, 11 Jun 2014 15:51:48 GMT"),
                "request": {
                    "method": "GET",
                    "uri": "/package.json",
                    "httpVersion": "1.1"
                },
                "size": 733,
                "statusCode": 200,
                "user": "",
                "userAgent": ""
            });
        return p;
    });

    it("Emit error where parsing fail", function(done) {
        transform.on("error", function(e) {
            assert(e instanceof Error);
            done();
        });
        transform.write("coucou");
    });

});
