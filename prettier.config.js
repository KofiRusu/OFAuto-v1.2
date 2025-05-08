module.exports = {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  proseWrap: 'always',
  overrides: [
    {
      files: ['*.md', '*.txt'],
      options: {
        proseWrap: 'always',
      },
    },
  ],
}
