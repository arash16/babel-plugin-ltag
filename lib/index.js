'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_ref) {
	var t = _ref.types;

	var reHasParams = /%\d+/g;
	var pots = {};
	function addToPot(file, str, ctx, ref) {
		if (!file) return;

		if (!pots[file] && fs.existsSync(file)) pots[file] = po.parse(fs.readFileSync(file, 'utf8'));

		var pot = pots[file] = pots[file] || {},
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
		var coms = item.comments = item.comments || {};

		if (reHasParams.test(str)) coms.flag = 'kde-format';

		if (coms.reference) {
			if (coms.reference.indexOf(ref) < 0) coms.reference += ' ' + ref;
		} else coms.reference = ref;
	}

	function savePotFiles() {
		for (var file in pots) {
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

		var tran = poFiles[file].translations,
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
	var reDeco = /\\[\\n%]/g;
	var reHole = /(?:(.*?)%(\d+))|(?:.*$)/g;
	return {
		post: function post(file) {
			savePotFiles();
		},
		visitor: {
			TaggedTemplateExpression: function TaggedTemplateExpression(path, state) {
				var node = path.node;


				var ctx = void 0;
				if (t.isCallExpression(node.tag) && t.isIdentifier(node.tag.callee, { name: 'l' })) {
					var args = path.get("tag.arguments");
					for (var i = 0; i < args.length; ++i) {
						var e = args[i].evaluate();
						if (!e.confident) return;
						if (ctx) ctx += '|';else ctx = '';
						ctx += e.value;
					}
				} else if (!t.isIdentifier(node.tag, { name: 'l' })) return;

				var _node$quasi = node.quasi,
				    quasis = _node$quasi.quasis,
				    exps = _node$quasi.expressions;

				var ref = node.loc.filename || path.hub.file.opts.filename + ':' + node.loc.start.line;

				// #, kde-format
				var srcStr = encode(quasis[0].value.cooked);
				for (var _i = 1; _i < quasis.length; ++_i) {
					srcStr += '%' + (_i - 1) + encode(quasis[_i].value.cooked);
				} // TODO: Plural Forms			msgid_plural / msgstr[0, 1...]
				var trStr = translate(state.opts, srcStr, ctx, ref);

				// ----------------------------------------------------------------------------

				// fill nodes with new orders
				var nodes = [];
				trStr.replace(/%%/g, '\0').replace(reHole, function (a, b, c) {
					var pre = (b === undefined ? a : b).replace(/\u0000/g, '%');
					nodes.push(t.stringLiteral(pre));
					if (c) nodes.push(exps[parseInt(c)]);
				});

				// filter out empty elements, insert a empty string at start
				nodes = nodes.filter(function (n) {
					return !t.isLiteral(n, { value: "" });
				});
				if (!isString(nodes[0]) && !isString(nodes[1])) nodes.unshift(t.stringLiteral(""));

				// merge consecutive literals, converting them to strings
				var sz = 1;
				for (var _i2 = 1; _i2 < nodes.length; ++_i2) {
					if (t.isLiteral(nodes[sz - 1]) && t.isLiteral(nodes[_i2])) nodes[sz - 1] = t.stringLiteral(nodes[sz - 1].value + nodes[_i2].value);else nodes[sz++] = nodes[_i2];
				}nodes.length = sz;

				var root = nodes.shift();
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var _node = _step.value;

						root = buildBinary(root, _node);
					}
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}

				path.replaceWith(root);
			}
		}
	};
};

var fs = require('fs');
var po = require("gettext-parser").po;

;
