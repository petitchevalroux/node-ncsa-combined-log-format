"use strict";
var Alpine = new require("alpine");
var stream = require("stream");
var Transform = stream.Transform;
var util = require("util");
var moment = require("moment");
var byline = require("byline");

module.exports = Clf;

function Clf(options) {
    options = options || {};
    if (options.dateFormat) {
        this.dateFormat = options.dateFormat;
        delete options.dateFormat;
    }
    options.readableObjectMode = true;
    this.started = false;
    this.toLineStream = new byline.LineStream();
    var alpine = new Alpine(Alpine.LOGFORMATS.COMBINED);
    var self = this;
    self.parseStream = new stream.Transform({
        "readableObjectMode": true,
        "transform": function(chunk, enc, cb) {
            var error = null,
                result = null;
            try {
                result = alpine.parseLine(chunk.toString());
            } catch (e) {
                error = e;
            }
            cb(error, result);
        }
    });
    self.outStream = new stream.Transform({
        "readableObjectMode": true,
        "writableObjectMode": true,
        "transform": function(chunk, encoding, cb) {
            self.transform(chunk, encoding, cb);
        }
    });
    self.outStream.on("data", function(data) {
        self.push(data);
    });
    [self.toLineStream, self.parseStream, self.outStream]
    .forEach(function(stream) {
        stream.on("error", function(error) {
            self.emit("error", error);
        });
    });
    Transform.call(this, options);
}

util.inherits(Clf, Transform);

Clf.prototype.start = function() {
    if (!this.started) {
        this.started = true;
        this.toLineStream
            .pipe(this.parseStream)
            .pipe(this.outStream);
    }
};

Clf.prototype._transform = function(chunk, enc, cb) {
    this.start();
    this.toLineStream.write(chunk, enc, function(err) {
        cb(err);
    });
};

Clf.prototype.transform = function(data, enc, done) {
    var obj, e = null;
    try {
        var request = this.parseRequest(data.request);
        obj = {
            host: data.remoteHost,
            logName: data.logname,
            user: data.remoteUser,
            date: this.formatDate(data.time),
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

    } catch (e) {
        this.emit("error", e);
    }
    done(e, obj);
};

Clf.prototype.formatDate = function(date) {
    return this.dateFormat ? moment(date, this.dateFormat)
        .toDate() : new Date(date);
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
