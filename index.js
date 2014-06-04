module.exports={
	base:{
		Core:require("./base/Core").Core,
		ArgParser:require("./base/ArgParser").ArgParser,
		BaseObject:require("./base/BaseObject").BaseObject,
		Accessor:require("./base/Accessor").Accessor
	},
	network:{
		http:{
			XMLHttpRequest:require("./network/http/XMLHttpRequest").XMLHttpRequest
		},
		Download:require("./network/Download").Download
	},
	async:require("./async/async"),
	filesystem:{
		Path:require("./filesystem/Path").Path
	},
	io:{
		InputStream:require("./io/InputStream").InputStream,
		OutputStream:require("./io/OutputStream").OutputStream
	}
};