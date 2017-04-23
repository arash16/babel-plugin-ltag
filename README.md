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
      "pot": "file.pot",  // pristine po file, all l-tagged templates inside source are written here
      "po": "file.po"    // actual po file to use for translation
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
```babel test.js```
`.pot` file will be generated, and with subsequent executions it will be updated.

```po
msgid ""
msgstr "Content-Type: text/plain;\n"

#: test.js:1
#, kde-format
msgid "Hi dear, %0"
msgstr ""

#: test.js:2
msgctxt "context"
msgid "Another message"
msgstr ""
```

5. Copy generated `.pot` file to a `.po` file and translate strings inside it. Run babel again and you'll have transformed code.

## TODO
* Plural Forms 
* TRANSLATOR comments extraction

