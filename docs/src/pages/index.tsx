import React from 'react'
import clsx from 'clsx'
import { MuiOtpInput } from '@wh1teee/mui-otp-input'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import DocusaurusImageUrl from '@site/static/img/logo.svg'
import Layout from '@theme/Layout'
import styles from './index.module.css'
import '../css/index.css'

const HomepageHeader = () => {
  const { siteConfig } = useDocusaurusContext()
  const [otp, setOtp] = React.useState<string>('')

  const handleChange = (value: string) => {
    setOtp(value)
  }

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <DocusaurusImageUrl width={180} height={180} />
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className={clsx('hero__subtitle', styles.subtitle)}>
          One shared OTP behavior contract with independent MUI and Base UI /
          shadcn renderers.
        </p>
        <MuiOtpInput
          TextFieldsProps={{ placeholder: '-' }}
          value={otp}
          length={6}
          onChange={handleChange}
          validationType="numeric"
        />
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

const Home = () => {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout description={siteConfig.tagline}>
      <HomepageHeader />
    </Layout>
  )
}

export default Home
