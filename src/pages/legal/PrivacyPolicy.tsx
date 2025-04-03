import Layout from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Welcome to JobTrakr ("we," "our," or "us"). We are committed to
              protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our job application
              tracking service.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree
              with the terms of this privacy policy, please do not access the
              application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-medium mt-4 mb-2">
              Personal Information
            </h3>
            <p>
              We may collect personal information that you provide to us,
              including but not limited to:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Name, email address, and contact details</li>
              <li>Account login credentials</li>
              <li>Employment history and resume information</li>
              <li>Job application details</li>
              <li>Information related to your job search activities</li>
            </ul>

            <h3 className="text-xl font-medium mt-4 mb-2">
              Information Automatically Collected
            </h3>
            <p>When you access our service, we may automatically collect:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>
                Device information (e.g., IP address, browser type, operating
                system)
              </li>
              <li>
                Usage data (e.g., pages visited, actions taken, time spent)
              </li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-medium mt-4 mb-2">
              Information From Third Parties
            </h3>
            <p>
              We may receive information about you from third-party sources such
              as LinkedIn and Indeed, when you choose to connect your accounts
              with our service. This information may include your job
              application history and profile information from these platforms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <p>
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>Providing, operating, and maintaining our service</li>
              <li>Personalizing your experience</li>
              <li>Processing and tracking your job applications</li>
              <li>
                Communicating with you about your account or job opportunities
              </li>
              <li>Sending notifications and reminders</li>
              <li>Improving our services and developing new features</li>
              <li>Detecting, preventing, and addressing technical issues</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Legal Basis for Processing
            </h2>
            <p>
              We process your personal information under the following legal
              bases:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>
                <strong>Consent:</strong> Where you have given us explicit
                consent to process your personal data.
              </li>
              <li>
                <strong>Contract:</strong> Where processing is necessary for the
                performance of a contract with you.
              </li>
              <li>
                <strong>Legitimate Interests:</strong> Where processing is
                necessary for our legitimate interests, provided those interests
                don't override your fundamental rights and freedoms.
              </li>
              <li>
                <strong>Legal Obligation:</strong> Where processing is necessary
                to comply with a legal or regulatory obligation.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              5. Data Sharing and Disclosure
            </h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who help
                us operate our service (e.g., cloud storage providers, email
                service providers).
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, acquisition, or sale of assets, your information may be
                transferred as a business asset.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                respond to legal processes or protect our rights.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share your
                information with other third parties with your explicit consent.
              </li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We will retain your personal information only for as long as
              necessary to fulfill the purposes outlined in this Privacy Policy,
              unless a longer retention period is required or permitted by law.
            </p>
            <p>
              When we no longer require your personal information, we will
              either delete it or anonymize it so that it can no longer be
              associated with you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
            <p>
              We have implemented appropriate technical and organizational
              security measures to protect your personal information from
              unauthorized access, disclosure, alteration, and destruction.
            </p>
            <p>
              Despite our best efforts, no method of data transmission over the
              Internet or electronic storage is 100% secure. Therefore, while we
              strive to use commercially acceptable means to protect your
              personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Your Data Protection Rights
            </h2>
            <p>
              Under UK and EU data protection laws, you have certain rights
              regarding your personal information:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>
                <strong>Right to Access:</strong> You have the right to request
                copies of your personal information.
              </li>
              <li>
                <strong>Right to Rectification:</strong> You have the right to
                request that we correct any information you believe is
                inaccurate or complete information you believe is incomplete.
              </li>
              <li>
                <strong>Right to Erasure:</strong> You have the right to request
                that we erase your personal information, under certain
                conditions.
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> You have the
                right to request that we restrict the processing of your
                personal information, under certain conditions.
              </li>
              <li>
                <strong>Right to Object to Processing:</strong> You have the
                right to object to our processing of your personal information,
                under certain conditions.
              </li>
              <li>
                <strong>Right to Data Portability:</strong> You have the right
                to request that we transfer the data we have collected to
                another organization, or directly to you, under certain
                conditions.
              </li>
            </ul>
            <p>
              If you make a request, we have one month to respond to you. If you
              would like to exercise any of these rights, please contact us at
              our email: privacy@jobtrakr.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              9. Cookies and Tracking Technologies
            </h2>
            <p>
              We use cookies and similar tracking technologies to track activity
              on our service and store certain information. Cookies are files
              with a small amount of data which may include an anonymous unique
              identifier.
            </p>
            <p>
              You can instruct your browser to refuse all cookies or to indicate
              when a cookie is being sent. However, if you do not accept
              cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              10. Children's Privacy
            </h2>
            <p>
              Our service is not intended for individuals under the age of 16.
              We do not knowingly collect personally identifiable information
              from anyone under 16 years of age. If you are a parent or guardian
              and you are aware that your child has provided us with personal
              data, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to — and maintained on —
              computers located outside of your state, province, country, or
              other governmental jurisdiction where data protection laws may
              differ from those in your jurisdiction.
            </p>
            <p>
              If you are located outside the United Kingdom and choose to
              provide information to us, please note that we transfer the data,
              including personal data, to the United Kingdom and process it
              there.
            </p>
            <p>
              Your consent to this Privacy Policy followed by your submission of
              such information represents your agreement to these transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date at the top of this page.
            </p>
            <p>
              You are advised to review this Privacy Policy periodically for any
              changes. Changes to this Privacy Policy are effective when they
              are posted on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <ul className="list-none pl-6 mt-2 mb-4">
              <li>By email: privacy@jobtrakr.com</li>
              <li>
                By mail: JobTrakr Ltd, 123 High Street, London, SW1A 1AA, United
                Kingdom
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
