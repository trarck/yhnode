var Core = require('../base/Core').Core;
var BaseObject = require('../base/BaseObject').BaseObject;
var fs = require('fs');
var path = require('path');
var urlParse = require("url").parse;
var http = require('http');
var https = require('https');
var EventEmitter= require('events').EventEmitter;

var MaxRetryTimes = 3;

var DefaultSetting = {
    maxRetry:3,
    retryInterval:1000,
    timeout:60000,
    maxRedirect:7
};

var Download = BaseObject.extend({

    initialize:function (s) {

        if(s){
            this._settings = Core.mixin({}, DefaultSetting, s);
        }else{
            this._settings = Core.mixin({}, DefaultSetting);
        }

        this._isRequesting = false;

    },

    _prepareUrl:function (url) {

        var options;

        if(this._settings.proxy){
            var proxy=this._settings.proxy;

            var path="";
            if(typeof url=="object"){
                path+=(url.protocol?url.protocol:"http")+"://"
                    +(url.path?url.path:(url.pathname+(url.search?url.search:"")))
            }else{
                path=url;
            }

            options = {
                host:proxy.host,
                port:proxy.port,
                path:path,
                method:url.method || 'GET'
            };

            this._settings.secure = proxy.protocol == "https" ? true : false;

        }else{
            var url = urlParse(url);
            options = {
                host:url.host,
                port:url.port,
                path:url.path||(url.pathname+(url.search?url.search:"")),
                method:url.method || 'GET'
            };

            this._settings.secure = url.protocol == "https" ? true : false;
        }
        this._settings.requestOptions = options;
    },

    open:function () {
        var self=this;
        var settings=this._settings;
        var options = settings.requestOptions;

        console.log("Download.open:" + options.host + (options.port ? ":" + options.port : "") + options.path);

        var req = (this._settings.secure ? https.request : http.request)(options, function (res) {

            console.log('request STATUS: ' + res.statusCode + ",url=" + options.host + (options.port ? ":" + options.port : "") + options.path);
            switch (res.statusCode) {
                case 301:
                case 302:
                case 303:
                case 307:
                    if(settings.redirectCount++<settings.maxRedirect){
                        self._prepareUrl(res.headers.location);
                        self.open();
                    }
                    return ;
                    break;
                case 200:
                    mkdirs(settings.localPath);
                    var outFileStream=fs.createWriteStream(settings.localPath,{
                        flags: 'w'
                    });
                    res.pipe(outFileStream);
                    res.on('end', function () {
//                        outFileStream.close();
                        self.doSuccess(res);
                        self.doComplete(res);
                    });
                    outFileStream.on("close",function(){
                        console.log("out close");
                    });
                    return;
                    break;
                case 503:
                case 0:
                    //retry
                    if(settings.retryCount<settings.maxRetry){
                        setTimeout( function(){
                            self.open();
                        }, settings.retryInterval);
                        settings.retryCount++;
                        settings.retryInterval*=2;
                        return;
                    }
                    break;
                default:
                    break;
            }
            //      console.log('HEADERS: ' + JSON.stringify(res.headers));
//            res.setEncoding('utf8');
            var buffers = [], size = 0;
            res.on('data', function (buffer) {
                buffers.push(buffer);
                size += buffer.length;
            });
            res.on('end', function () {
                var buffer = new Buffer(size), pos = 0;
                for (var i = 0, l = buffers.length; i < l; i++) {
                    buffers[i].copy(buffer, pos);
                    pos += buffers[i].length;
                }
                res.responseBody=buffer;

                switch (res.statusCode) {
                    case 404:
                        self.doFailure(res);
                        break;
                    case 503:
                    case 0:
                        self.doFailure(res);
                        break;
                    default:
                        break;
                }
                self.doComplete(res);
            });
        });
        req.on('error', function (e) {
            self.doError(e);
        });
        req.end();
    },

    start:function (uri, localPath, encoding) {

        this._settings.redirectCount=0;
        this._settings.retryCount=0;
        this._settings.localPath=localPath;
        this._settings.encoding=encoding;

        this._prepareUrl(uri);

        this.open();

    },

    doSuccess:function(res){
        if(typeof this.onSuccess=="function") this.onSuccess(res);

        this.emit("sucess",res);
    },

    doComplete:function (res) {
        if(typeof this.onComplete=="function") this.onComplete(res);
        this.emit("complete",res);
    },

    doFailure:function(res){
        if(typeof this.onFailure=="function") this.onFailure(res);
        this.emit("failure",res);
    },

    doError:function(ex){
        if(typeof this.onError=="function") this.onError(res);
        this.emit("error",res);
    }

}, {


}, EventEmitter);

function mkdirs(file) {
    var dir = path.basename(file).indexOf(".") > -1 ? path.dirname(file) : file;
    var paths = [];
    while (!fs.existsSync(dir)) {
        paths.push(dir);
        dir = path.dirname(dir);
    }
    while (p = paths.pop()) {
        fs.mkdirSync(p);
    }
}
exports.Download = Download;