# ltag
ltag is a [babel](https://babeljs.io/) pluging for client-side javascript localization using templates.
You can tag your template strings with `l` and afterwards you will be able to generate different versions of the same code, for different languages.

Translations will be provided with `.po` files (an empty one will be generated for you).
[More on .po format](http://pology.nedohodnik.net/doc/user/en_US/ch-poformat.html)

## Usage
Install babel as global, and ltag plugin as a development dependency:
```
npm install -g babel-cli
npm install --save-dev babel-plugin-ltag
```

Create a file named [.babelrc](http://babeljs.io/docs/usage/babelrc/) inside your project's root:
```javascript
{
  "plugins": [
    ["babel-plugin-ltag", {
      // pristine po file, all l-tagged templates inside source are written here
      "pot": "file.pot",

      // actual po file to use for translation
      "po": "file.po"
    }]
  ]
}
```

Inside your application use ltag:
```javascript
console.log(l`Hi dear, ${username}`);
console.log(l('context')`Another message`);
```

Run babel over your code:
```
babel test.js
```
`.pot` file will be generated, and with subsequent executions it will be updated.

```po
msgid ""
msgstr "Content-Type: text/plain; charset=utf-8"

#: test.js:1
#, kde-format
msgid "Hi dear, %0"
msgstr ""

#: test.js:2
msgctxt "context"
msgid "Another message"
msgstr ""
```

Copy generated `.pot` file to a `.po` file and translate strings inside it. Run babel again and you'll have a transformed code.

## TODO
* Plural Forms 
* TRANSLATOR comments extraction

