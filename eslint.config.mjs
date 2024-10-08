import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "es6"}},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
];

