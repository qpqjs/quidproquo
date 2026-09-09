import type { PrismTheme } from 'prism-react-renderer';
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

// Code highlighting palette matching the landing page's code window
// (qpq/spa/src/index.css tok-* classes).
const qpqPrismTheme: PrismTheme = {
  plain: {
    color: '#c9dde8',
    backgroundColor: 'transparent',
  },
  styles: [
    { types: ['keyword', 'operator', 'atrule'], style: { color: '#7dd3fc' } },
    { types: ['function', 'function-variable'], style: { color: '#8df6ff' } },
    {
      types: ['string', 'char', 'attr-value', 'url', 'regex'],
      style: { color: '#fbbf77' },
    },
    {
      types: ['class-name', 'maybe-class-name', 'builtin', 'namespace'],
      style: { color: '#86efac' },
    },
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#5c7181', fontStyle: 'italic' as const },
    },
    {
      types: [
        'number',
        'boolean',
        'constant',
        'symbol',
        'property',
        'attr-name',
        'variable',
      ],
      style: { color: '#c4b5fd' },
    },
    { types: ['punctuation'], style: { color: '#8fa8b8' } },
    { types: ['tag', 'selector'], style: { color: '#7dd3fc' } },
    { types: ['deleted'], style: { color: '#ff5f57' } },
    { types: ['inserted'], style: { color: '#28c840' } },
  ],
};

const config: Config = {
  title: 'quidproquo',
  tagline: 'Write the story, run it anywhere',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.quidproquojs.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'qpqjs', // Usually your GitHub org/user name.
  projectName: 'quidproquo', // Usually your repo name.

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Same font stack as the landing page (qpq/spa/index.html)
  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
  ],
  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap',
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/qpqjs/quidproquo/tree/main/quidproquojs.com/docusaurus/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'quidproquo',
      logo: {
        alt: 'quidproquo logo',
        src: 'img/qpq-logo.svg',
        href: 'https://quidproquojs.com',
        target: '_self',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API Reference',
        },
        {
          href: 'https://quidproquojs.com',
          label: 'quidproquojs.com',
          position: 'right',
        },
        {
          href: 'https://github.com/qpqjs/quidproquo',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started',
            },
            {
              label: 'Core Concepts',
              to: '/core-concepts',
            },
            {
              label: 'API Reference',
              to: '/api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/qpqjs/quidproquo',
            },
            {
              label: 'quidproquojs.com',
              href: 'https://quidproquojs.com',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} quidproquo — write the story, run it anywhere.`,
    },
    prism: {
      theme: qpqPrismTheme,
      darkTheme: qpqPrismTheme,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
