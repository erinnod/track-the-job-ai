import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  // Define Content Security Policy
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.vercel-insights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https://*.supabase.co https://*.supabase.com https://*.gravatar.com https://avatars.githubusercontent.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com;
    frame-src 'self' https://*.supabase.co;
    base-uri 'self';
    form-action 'self';
    report-to default;
    report-uri /api/csp-report;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  return (
    <Html lang="en">
      <Head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta
          httpEquiv="Strict-Transport-Security"
          content="max-age=31536000; includeSubDomains; preload"
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
