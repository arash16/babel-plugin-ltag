const fs = require('fs');
const po = require("gettext-parser").po;


export default function ({ types: t }) {
	let reHasParams = /%\d+/g;
	var pots = {};
	function addToPot(file, str, ctx, ref) {
		if (!file) return;

		if (!pots[file] && fs.existsSync(file))
			pots[file] = po.parse(fs.readFileSync(file, 'utf8'));

		let pot = pots[file] = pots[file] || {},
			tran = pot.translations = pot.translations || {},
			ctxs = tran[ctx] = tran[ctx] || {},
			item = ctxs[str] = ctxs[str] || {};

		if (!pot.charset) {
			pot.charset = 'utf-8';
			pot.headers = {
				'content-type': 'text/plain; charset=utf-8'
			};
		}

		item.msgctxt = ctx;
		item.msgid = str;
		let coms = item.comments = item.comments || {};

		if (reHasParams.test(str))
			coms.flag = 'kde-format';

		if (coms.reference) {
			if (coms.reference.indexOf(ref) < 0)
				coms.reference += ' ' + ref;
		}
		else coms.reference = ref;
	}

	function savePotFiles() {
		for (let file in pots) {
			var data = po.compile(pots[file]);
			fs.writeFileSync(file, data);
		}
	}

	var poFiles = {};
	function readPoFile(file, str, ctx) {
		if (!file) return;
		
		if (!poFiles[file]) {
			if (!fs.existsSync(file)) return;
			poFiles[file] = po.parse(fs.readFileSync(file, 'utf8'));
		}

		let tran = poFiles[file].translations,
			item = (tran[ctx] || {})[str];
		
		if (item) return item.msgstr[0];
	}

	// -------------------------------------------------------------------

	function isString(node) {
		return t.isLiteral(node) && typeof node.value === "string";
	}

	function buildBinary(left, right) {
		return t.binaryExpression("+", left, right);
	}
	
	function translate(opts, str, ctx, ref) {
		// save to pristine po-file
		if (!ctx) ctx = '';
		addToPot(opts.pot, str, ctx, ref);
		return readPoFile(opts.po, str, ctx) || str;
	}


	function encode(str) {
		return str.replace(/%/g, '%%');
	}

	// escape double quote
	const reDeco = /\\[\\n%]/g;
	const reHole = /(?:(.*?)%(\d+))|(?:.*$)/g;
	return {
		post: function (file) {
			savePotFiles();
		},
		visitor: {
			TaggedTemplateExpression(path, state) {
				const { node } = path;

				let ctx;
				if (t.isCallExpression(node.tag) && t.isIdentifier(node.tag.callee, {name:'l'})) {
					let args = path.get("tag.arguments");
					for (let i=0; i<args.length; ++i) {
						let e = args[i].evaluate();
						if (!e.confident) return;
						if (ctx) ctx += '|';
						else ctx = '';
						ctx += e.value;
					}
				}
				else if (!t.isIdentifier(node.tag, {name:'l'})) return;

				const { quasis, expressions: exps } = node.quasi;
				const ref = (node.loc.filename || path.hub.file.opts.filename) + ':' + node.loc.start.line;

				// #, kde-format
				let srcStr = encode(quasis[0].value.cooked);
				for (let i=1; i<quasis.length; ++i)
					srcStr += '%' + (i-1) + encode(quasis[i].value.cooked);

				// TODO: Plural Forms			msgid_plural / msgstr[0, 1...]
				let trStr = translate(state.opts, srcStr, ctx, ref);


				// ----------------------------------------------------------------------------

				// fill nodes with new orders
				let nodes = [];
				trStr
					.replace(/%%/g, '\u0000')
					.replace(reHole, function (a, b, c) {
						let pre = (b===undefined ? a : b).replace(/\u0000/g, '%');
						nodes.push(t.stringLiteral(pre));
						if (c) nodes.push(exps[parseInt(c)]);
					});


				// filter out empty elements, insert a empty string at start
				nodes = nodes.filter((n) => !t.isLiteral(n, { value: "" }));
				if (!isString(nodes[0]) && !isString(nodes[1]))
					nodes.unshift(t.stringLiteral(""));

				// merge consecutive literals, converting them to strings
				let sz = 1;
				for (let i=1; i<nodes.length; ++i)
					if (t.isLiteral(nodes[sz-1]) && t.isLiteral(nodes[i]))
						 nodes[sz-1] = t.stringLiteral(nodes[sz-1].value + nodes[i].value);
					else nodes[sz++] = nodes[i];
				nodes.length = sz;

				let root = nodes.shift();
				for (const node of nodes)
					root = buildBinary(root, node);
				path.replaceWith(root);
			}
		}
	}
};
