"use strict";
var Alpine = new require("alpine");
var stream = require("stream");
var Transform = stream.Transform;
var util = require("util");

module.exports = Clf;

function Clf(options) {
    options = options || {};
    options.readableObjectMode = true;
    this.alpine = new Alpine(Alpine.LOGFORMATS.COMBINED);
    Transform.call(this, options);
}
util.inherits(Clf, Transform);

Clf.prototype._transform = function(chunk, enc, done) {
    try {
        var self = this;
        var input = chunk.toString();
        input.split(/\n/)
            .forEach(function(line) {
                var data = self.alpine.parseLine(line);
                var request = self.parseRequest(data.request);
                var obj = {
                    host: data.remoteHost,
                    logName: data.logname,
                    user: data.remoteUser,
                    date: new Date(data.time),
                    request: request,
                    statusCode: Number(data.status),
                    size: Number(data.sizeCLF),
                    referer: data["RequestHeader Referer"],
                    userAgent: data["RequestHeader User-agent"]
                };
                Object.getOwnPropertyNames(obj)
                    .forEach(function(name) {
                        if (obj[name] === "-" || typeof(obj[name]) ===
                            "undefined") {
                            obj[name] = "";
                        }
                    });
                self.push(obj);
            });
    } catch (e) {
        this.emit("error", e);
    }

    done();
};

Clf.prototype.parseRequest = function(request) {
    var match = request.match(new RegExp(
        "(GET|HEAD|POST|PUT|DELETE|CONNECT|OPTIONS|TRACE|PATCH) (.*?) HTTP/([0-9]\.[0-9])"
    ));
    return {
        "method": match[1],
        "httpVersion": match[3],
        "uri": match[2]
    };
};
