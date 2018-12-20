module.exports = {
    title: 'Vetur',
    description: "Vue tooling for VS Code.",
    base: '/wxa-vscode/',
    markdown: {
      linkify: true
    },
    themeConfig: {
      repo: 'wxajs/wxa-vscode',
      editLinks: true,
      docsDir: 'docs',
      sidebar: [
        '/setup',
        {
            title: 'Features',
            collapsable: false,
            children: [
                '/highlighting',
                '/snippet',
                '/emmet',
                '/linting-error',
                '/formatting',
                '/intellisense',
                '/debugging',
                '/framework'
            ]
        },
        '/FAQ',
        '/CONTRIBUTING',
        '/roadmap',
        '/CHANGELOG',
        '/credits'
    ]
    }
  }
