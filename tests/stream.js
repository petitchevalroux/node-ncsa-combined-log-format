"use strict";
var path = require("path");
var Clf = require(path.join(".."));
var Promise = require("bluebird");
var assert = require("assert");
describe("Transform stream", function() {

    function checkResult(entry, result, clf) {
        clf = clf || new Clf();
        return new Promise(function(resolve, reject) {
            clf.write(entry + "\n");
            try {
                assert.deepEqual(result, clf.read());
                resolve(result);
            } catch (e) {
                reject(e);
            }
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
        var transform = new Clf();
        transform.on("error", function(e) {
            assert(e instanceof Error);
            done();
        });
        transform.write("coucou\n");
    });

    it("Parse date formated as 14/Mar/2017:06:42:25 +0100", function() {
        var p = checkResult(
            "127.0.0.1 - - [14/Mar/2017:06:42:25 +0100] \"GET /package.json HTTP/1.1\" 200 733 \"-\" \"-\"", {
                "host": "127.0.0.1",
                "logName": "",
                "referer": "",
                "date": new Date(
                    "2017-03-14T05:42:25.000Z"),
                "request": {
                    "method": "GET",
                    "uri": "/package.json",
                    "httpVersion": "1.1"
                },
                "size": 733,
                "statusCode": 200,
                "user": "",
                "userAgent": ""
            }, new Clf({
                "dateFormat": "DD/MMM/YYYY:HH:mm:ss ZZ"
            }));
        return p;
    });

});
