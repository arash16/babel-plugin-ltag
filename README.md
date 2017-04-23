# ltag
ltag is a babel-pluging for localization, transforms templates tagged l.

## Usage
1. Install babel as global, and ltag plugin as a development dependency:
```
npm install -g babel-cli
npm install --save-dev babel-plugin-ltag
```

2. Create a `.babelrc` file:
```javascript
{
	"plugins": [
		["babel-plugin-ltag", {
			"pot": "file.pot",	// pristine po file, all l-tagged templates inside source are written here
			"po": "file.po"		// actual po file to use for translation
		}]
	]
}
```

3. Inside your application use ltag:
```javascript
console.log(l`Hi dear, ${username}`);
console.log(l('context')`Another message`);
```

4. Run babel over your code:
```babel code.js```

5. `.pot` file will be generated, and with later executions of babel will be updated, copy it over `.po` file, add translations and rerun babel.

