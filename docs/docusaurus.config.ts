import { themes } from 'prism-react-renderer'
import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'

const config = {
  title: 'React OTP input',
  tagline: 'Independent MUI and Base UI/shadcn renderers for one-time codes',
  url: 'https://wh1teee.github.io',
  baseUrl: '/mui-otp-input/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn'
    }
  },

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  // Usually your GitHub org/user name.
  organizationName: 'wh1teee',
  // Usually your repo name.
  projectName: 'mui-otp-input',
  deploymentBranch: 'gh-pages',
  trailingSlash: true,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html gitlang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  presets: [
    [
      'classic',
      {
        theme: {
          customCss: require.resolve('./src/css/custom.css')
        },
        docs: {
          sidebarPath: require.resolve('./sidebars.js')
        },
        gtag: {
          trackingID: 'G-EFWS83QT8J'
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false
    },
    navbar: {
      title: 'React OTP input',
      logo: {
        alt: 'React OTP input',
        src: 'img/logo.svg'
      },
      items: [
        {
          type: 'doc',
          docId: 'getting-started',
          position: 'left',
          label: 'Documentation'
        },
        {
          href: 'https://github.com/wh1teee/mui-otp-input',
          label: 'GitHub',
          position: 'right'
        },
        {
          href: 'https://www.npmjs.com/package/@wh1teee/mui-otp-input',
          label: 'NPM',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} by the mui-otp-input contributors`
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula
    }
  }
} satisfies Config

export default config
