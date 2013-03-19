var BaseObject = require('../base/BaseObject.js').BaseObject;

var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(delims),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
        .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
        'javascript': true,
        'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
        'javascript': true,
        'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
    }

var URI = BaseObject.extend({

    classname:'URI',

    initialize:function () {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
    },
    parse : function(url, parseQueryString, slashesDenoteHost) {
        if (typeof url !== 'string') {
            throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
        }

        var rest = url;

        // trim before proceeding.
        // This is to support parse stuff like "  http://foo.com  \n"
        rest = rest.trim();

        var proto = protocolPattern.exec(rest);
        if (proto) {
            proto = proto[0];
            var lowerProto = proto.toLowerCase();
            this.protocol = lowerProto;
            rest = rest.substr(proto.length);
        }

        // figure out if it's got a host
        // user@server is *always* interpreted as a hostname, and url
        // resolution will treat //foo/bar as host=foo,path=bar because that's
        // how the browser resolves relative URLs.
        if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
            var slashes = rest.substr(0, 2) === '//';
            if (slashes && !(proto && hostlessProtocol[proto])) {
                rest = rest.substr(2);
                this.slashes = true;
            }
        }

        if (!hostlessProtocol[proto] &&
            (slashes || (proto && !slashedProtocol[proto]))) {
            // there's a hostname.
            // the first instance of /, ?, ;, or # ends the host.
            // don't enforce full RFC correctness, just be unstupid about it.

            // If there is an @ in the hostname, then non-host chars *are* allowed
            // to the left of the first @ sign, unless some non-auth character
            // comes *before* the @-sign.
            // URLs are obnoxious.
            var atSign = rest.indexOf('@');
            if (atSign !== -1) {
                var auth = rest.slice(0, atSign);

                // there *may be* an auth
                var hasAuth = true;
                for (var i = 0, l = nonAuthChars.length; i < l; i++) {
                    if (auth.indexOf(nonAuthChars[i]) !== -1) {
                        // not a valid auth.  Something like http://foo.com/bar@baz/
                        hasAuth = false;
                        break;
                    }
                }

                if (hasAuth) {
                    // pluck off the auth portion.
                    this.auth = decodeURIComponent(auth);
                    rest = rest.substr(atSign + 1);
                }
            }

            var firstNonHost = -1;
            for (var i = 0, l = nonHostChars.length; i < l; i++) {
                var index = rest.indexOf(nonHostChars[i]);
                if (index !== -1 &&
                    (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
            }

            if (firstNonHost !== -1) {
                this.host = rest.substr(0, firstNonHost);
                rest = rest.substr(firstNonHost);
            } else {
                this.host = rest;
                rest = '';
            }

            // pull out port.
            this.parseHost();

            // we've indicated that there is a hostname,
            // so even if it's empty, it has to be present.
            this.hostname = this.hostname || '';

            // if hostname begins with [ and ends with ]
            // assume that it's an IPv6 address.
            var ipv6Hostname = this.hostname[0] === '[' &&
                this.hostname[this.hostname.length - 1] === ']';

            // validate a little.
            if (!ipv6Hostname) {
                var hostparts = this.hostname.split(/\./);
                for (var i = 0, l = hostparts.length; i < l; i++) {
                    var part = hostparts[i];
                    if (!part) continue;
                    if (!part.match(hostnamePartPattern)) {
                        var newpart = '';
                        for (var j = 0, k = part.length; j < k; j++) {
                            if (part.charCodeAt(j) > 127) {
                                // we replace non-ASCII char with a temporary placeholder
                                // we need this to make sure size of hostname is not
                                // broken by replacing non-ASCII by nothing
                                newpart += 'x';
                            } else {
                                newpart += part[j];
                            }
                        }
                        // we test again with ASCII char only
                        if (!newpart.match(hostnamePartPattern)) {
                            var validParts = hostparts.slice(0, i);
                            var notHost = hostparts.slice(i + 1);
                            var bit = part.match(hostnamePartStart);
                            if (bit) {
                                validParts.push(bit[1]);
                                notHost.unshift(bit[2]);
                            }
                            if (notHost.length) {
                                rest = '/' + notHost.join('.') + rest;
                            }
                            this.hostname = validParts.join('.');
                            break;
                        }
                    }
                }
            }

            if (this.hostname.length > hostnameMaxLen) {
                this.hostname = '';
            } else {
                // hostnames are always lower case.
                this.hostname = this.hostname.toLowerCase();
            }

            if (!ipv6Hostname) {
                // IDNA Support: Returns a puny coded representation of "domain".
                // It only converts the part of the domain name that
                // has non ASCII characters. I.e. it dosent matter if
                // you call it with a domain that already is in ASCII.
                var domainArray = this.hostname.split('.');
                var newOut = [];
                for (var i = 0; i < domainArray.length; ++i) {
                    var s = domainArray[i];
                    newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
                        'xn--' + punycode.encode(s) : s);
                }
                this.hostname = newOut.join('.');
            }

            var p = this.port ? ':' + this.port : '';
            var h = this.hostname || '';
            this.host = h + p;
            this.href += this.host;

            // strip [ and ] from the hostname
            // the host field still retains them, though
            if (ipv6Hostname) {
                this.hostname = this.hostname.substr(1, this.hostname.length - 2);
                if (rest[0] !== '/') {
                    rest = '/' + rest;
                }
            }
        }

        // now rest is set to the post-host stuff.
        // chop off any delim chars.
        if (!unsafeProtocol[lowerProto]) {

            // First, make 100% sure that any "autoEscape" chars get
            // escaped, even if encodeURIComponent doesn't think they
            // need to be.
            for (var i = 0, l = autoEscape.length; i < l; i++) {
                var ae = autoEscape[i];
                var esc = encodeURIComponent(ae);
                if (esc === ae) {
                    esc = escape(ae);
                }
                rest = rest.split(ae).join(esc);
            }
        }


        // chop off from the tail first.
        var hash = rest.indexOf('#');
        if (hash !== -1) {
            // got a fragment string.
            this.hash = rest.substr(hash);
            rest = rest.slice(0, hash);
        }
        var qm = rest.indexOf('?');
        if (qm !== -1) {
            this.search = rest.substr(qm);
            this.query = rest.substr(qm + 1);
            if (parseQueryString) {
                this.query = querystring.parse(this.query);
            }
            rest = rest.slice(0, qm);
        } else if (parseQueryString) {
            // no query string, but parseQueryString still requested
            this.search = '';
            this.query = {};
        }
        if (rest) this.pathname = rest;
        if (slashedProtocol[proto] &&
            this.hostname && !this.pathname) {
            this.pathname = '/';
        }

        //to support http.request
        if (this.pathname || this.search) {
            var p = this.pathname || '';
            var s = this.search || '';
            this.path = p + s;
        }

        // finally, reconstruct the href based on what has been validated.
        this.href = this.format();
        return this;
    },
    isHttpUri:function (uri) {
        return this._parseUriString(uri);
    },
    _parseUriString:function (str, checkOnly) {
        //var reg = /^(https?):\/\/([\-_.!~*\'()a-zA-Z0-9;:\@&=+\$,%]+)\/?([\-_.!~*\'()a-zA-Z0-9;\/:\@&=+\$,%]*)\??([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%]*)\#?([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]*)/i;
        var reg = /^(https?):\/\/([\-_.!~*\'()a-zA-Z0-9;\@&=+\$,%]+):?(\d*)\/?([\-_.!~*\'()a-zA-Z0-9;\/:\@&=+\$,%]*)\??([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%]*)\#?([\-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]*)/i;
        var m = str.match(reg);
        if (m) {
            if (!checkOnly) {
                this._protocol = m[1].toLowerCase();
                this._host = m[2].toLowerCase();
                this._port = m[3];//m[3]?m[3]:(this._protocol=="http"?80:(this._protocol=="https"?443:this._port));
                this._path = this._parsePath(m[4]);
                this._query = this._parseQuery(m[5]);
                this._fragment = m[6];
            }
            return true;
        }
        else {
            return false;
        }
    },
    get protocol() {
        return this._protocol;
    },
    set protocol(value) {
        if (typeof value !== 'string') {
            throw new Error("network.http.URI: protocol '" + value + "' is not suported");
        }
        value = value.toLowerCase();
        if (value === 'http' || value === 'https') {
            this._protocol = value;
        }
        else {
            throw new Error("network.http.URI: protocol '" + value + "' is not suported");
        }
    },
    get host() {
        return this._host;
    },
    set host(value) {
        if (typeof value !== 'string') {
            throw new Error("network.http.URI: host '" + value + "' is not suported");
        }
        else {
            this._host = value;
        }
    },
    get path() {
        if (this._path.length === 0) {
            return "/";
        }
        return "/" + this._path.join("/");
    },
    set path(value) {
        if (typeof value === 'object' && value instanceof Array) {
            this._path = value;
        }
        else if (typeof value === 'string') {
            this._path = this._parsePath(value);
        }
        else {
            throw new Error("network.http.URI: path '" + value + "' is not suported");
        }
    },
    get query() {
        var i;
        var len = this._query.length;
        var ret = [];
        for (i = 0; i < len; i++) {
            ret.push(this._query[i].original);
        }
        return ret.join("&");
    },
    set query(value) {
        if (typeof value === 'string') {
            this._query = this._parseQuery(value);
        }
        else {
            throw new Error("network.http.URI: query '" + value + "' is not suported");
        }
    },
    get fragment() {
        return this._fragment;
    },
    set fragment(value) {
        if (typeof value === 'string') {
            this._fragment = value;
        }
        else {
            throw new Error("network.http.URI: query '" + value + "' is not supported");
        }
    },
    /**
     * Return URI in string.
     * @retuns {String} URI string.
     */
    toString:function () {
        var uri = this.protocol + "://"
            + this.host
            + this.path;
        var query = this.query;
        if (query) {
            uri = uri + '?' + query;
        }
        var fragment = this.fragment;
        if (fragment) {
            uri = uri + "#" + fragment;
        }
        return uri;
    },
    /** @private */
    _parsePath:function (path) {
        if (!path || typeof path !== 'string') {
            return [];
        }
        var ret = path.split('/');
        return ret;
    },
    /** @private */
    _buildPath:function (path) {
        if (!path || !path instanceof Array) {
            return '/';
        }
        return '/' + path.join('/');
    },
    _parseQuery:function (query) {
        var i;
        if (!query || typeof query !== 'string') {
            return [];
        }
        var list = query.split("&");

        var len = list.length;
        var ret = [];
        for (i = 0; i < len; i++) {
            var entry = list[i].split("=");
            ret.push({
                original:list[i],
                key:entry[0] ? decodeURIComponent(entry[0]) : "",
                value:entry[1] ? decodeURIComponent(entry[1]) : ""
            });
        }
        return ret;
    },
    /** @private */
    _buildQuery:function (query) {
        var i;
        if (!query || !query instanceof Array) {
            return "";
        }
        var len = query.length;
        var list = [];

        for (i = 0; i < length; ++i) {
            list.push(query[i].original);
        }
        return list.join("&");
    }
});

exports.URI = URI;
