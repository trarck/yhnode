var fs = require('fs');
var path=require('path');

exports.Path = {
	
	mkdirs:function (dir) {
	    var paths = [];
	    while (!fs.existsSync(dir)) {
	        paths.push(dir);
	        dir = path.dirname(dir);
	    }
	    while (p = paths.pop()) {
	        fs.mkdirSync(p);
	    }
	},
	
	fixLastSep:function(dir){
		if (dir[dir.length-1]!=path.sep) {
			dir+=path.sep;
		}
		return dir;
	}
};
