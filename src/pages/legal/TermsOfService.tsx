import Layout from "@/components/layout/Layout";

const TermsOfService = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              These Terms of Service ("Terms") govern your use of JobTrakr (the
              "Service"), operated by JobTrakr Ltd ("we," "us," or "our").
            </p>
            <p>
              By accessing or using the Service, you agree to be bound by these
              Terms. If you disagree with any part of the terms, you may not
              access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Accounts</h2>
            <p>
              When you create an account with us, you must provide accurate,
              complete, and current information. Failure to do so constitutes a
              breach of the Terms, which may result in immediate termination of
              your account.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to
              access the Service and for any activities or actions under your
              password.
            </p>
            <p>
              You agree not to disclose your password to any third party. You
              must notify us immediately upon becoming aware of any breach of
              security or unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use</h2>
            <p>
              You may use our Service only for lawful purposes and in accordance
              with these Terms. You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>
                In any way that violates any applicable national or
                international law or regulation.
              </li>
              <li>
                To transmit, or procure the sending of, any advertising or
                promotional material, including any "junk mail," "chain letter,"
                "spam," or any other similar solicitation.
              </li>
              <li>
                To impersonate or attempt to impersonate JobTrakr, a JobTrakr
                employee, another user, or any other person or entity.
              </li>
              <li>
                To engage in any other conduct that restricts or inhibits
                anyone's use or enjoyment of the Service, or which may harm
                JobTrakr or users of the Service.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              4. Intellectual Property
            </h2>
            <p>
              The Service and its original content, features, and functionality
              are and will remain the exclusive property of JobTrakr Ltd and its
              licensors. The Service is protected by copyright, trademark, and
              other laws of both the United Kingdom and foreign countries.
            </p>
            <p>
              Our trademarks and trade dress may not be used in connection with
              any product or service without the prior written consent of
              JobTrakr Ltd.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            <p>
              Our Service allows you to post, link, store, share and otherwise
              make available certain information, text, graphics, videos, or
              other material ("User Content"). You are responsible for the User
              Content that you post to the Service, including its legality,
              reliability, and appropriateness.
            </p>
            <p>
              By posting User Content to the Service, you grant us the right and
              license to use, modify, perform, display, reproduce, and
              distribute such content on and through the Service.
            </p>
            <p>
              You represent and warrant that: (i) the User Content is yours or
              you have the right to use it and grant us the rights and license
              as provided in these Terms, and (ii) the posting of your User
              Content on or through the Service does not violate the privacy
              rights, publicity rights, copyrights, contract rights or any other
              rights of any person.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              6. Third-Party Services
            </h2>
            <p>
              The Service may contain links to third-party websites or services
              that are not owned or controlled by JobTrakr Ltd.
            </p>
            <p>
              JobTrakr Ltd has no control over, and assumes no responsibility
              for, the content, privacy policies, or practices of any
              third-party websites or services. You further acknowledge and
              agree that JobTrakr Ltd shall not be responsible or liable,
              directly or indirectly, for any damage or loss caused or alleged
              to be caused by or in connection with the use of or reliance on
              any such content, goods, or services available on or through any
              such websites or services.
            </p>
            <p>
              We strongly advise you to read the terms and conditions and
              privacy policies of any third-party websites or services that you
              visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason whatsoever, including
              without limitation if you breach the Terms.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately
              cease. If you wish to terminate your account, you may simply
              discontinue using the Service or contact us to request account
              deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              8. Limitation of Liability
            </h2>
            <p>
              In no event shall JobTrakr Ltd, nor its directors, employees,
              partners, agents, suppliers, or affiliates, be liable for any
              indirect, incidental, special, consequential or punitive damages,
              including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 mt-2 mb-4">
              <li>
                Your access to or use of or inability to access or use the
                Service;
              </li>
              <li>Any conduct or content of any third party on the Service;</li>
              <li>Any content obtained from the Service; and</li>
              <li>
                Unauthorized access, use or alteration of your transmissions or
                content.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is
              provided on an "AS IS" and "AS AVAILABLE" basis. The Service is
              provided without warranties of any kind, whether express or
              implied, including, but not limited to, implied warranties of
              merchantability, fitness for a particular purpose,
              non-infringement or course of performance.
            </p>
            <p>
              JobTrakr Ltd, its subsidiaries, affiliates, and its licensors do
              not warrant that a) the Service will function uninterrupted,
              secure or available at any particular time or location; b) any
              errors or defects will be corrected; c) the Service is free of
              viruses or other harmful components; or d) the results of using
              the Service will meet your requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of the United Kingdom, without regard to its conflict of law
              provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of those rights. If any provision of
              these Terms is held to be invalid or unenforceable by a court, the
              remaining provisions of these Terms will remain in effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              11. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will try to
              provide at least 30 days' notice prior to any new terms taking
              effect. What constitutes a material change will be determined at
              our sole discretion.
            </p>
            <p>
              By continuing to access or use our Service after those revisions
              become effective, you agree to be bound by the revised terms. If
              you do not agree to the new terms, please stop using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none pl-6 mt-2 mb-4">
              <li>By email: legal@jobtrakr.com</li>
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

export default TermsOfService;
