var falafel = require('falafel');

process.stdin.setEncoding('utf8');

var src = "";
process.stdin.on('readable', function() {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		src += chunk;
	}
});
process.stdin.on('end', function() {
	var to = process.argv[2];
	var from = src
		.match(/\(function\((\w+,\s*)+(\w+)/g)[0]
		.replace('(function(', '')
		.split(',')
		.map(
			function(s) {
				return s.trim();
			}
		);
	var pairs = {};
	for (var i = 0; i < from.length; i++) {
		pairs[from[i]] = to[i];
	}

	var output = falafel(src, function(node) {
		var name = (
			node.type === 'Identifier' ?
				node.name :
				node.type === 'Literal' ?  node.value : null
		);
		if (name && pairs[name]) {
			if (node.type === 'Literal') {
				node.update(node.raw.replace(name, pairs[name]));
			}
			else {
				node.update(pairs[name]);
			}
		}
	});
	console.log(output);
});
