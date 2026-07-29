import React, { useState, useEffect } from 'react'

export default function TermsAndConditions() {
  const [theme, setTheme] = useState({})

  useEffect(() => {
    const colorKeys = ['name', 'email', 'phone', 'address', 'lastUpdatedTerms', 'orgJurisdiction']
    const loadedTheme = {}
    colorKeys.forEach((key) => {
      const value = localStorage.getItem(`web_${key}`)
      if (value) loadedTheme[key] = value
    })
    setTheme(loadedTheme)
  }, [])

  const orgName = `${theme?.name || '[Organization Name]'} Parivar`
  const jurisdiction = theme?.orgJurisdiction || '[Insert Jurisdiction/Country]'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">
        Last Updated: {theme?.lastUpdatedTerms || '12/06/2026'}
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
        <p className="leading-relaxed mb-2">
          These Terms and Conditions ("Terms") govern your access to and use of the {orgName}{' '}
          website, including any registration, membership features, donation services, and related
          content (collectively, the "Services").
        </p>
        <p className="leading-relaxed">
          By accessing or using our website, creating an account, or making a donation, you agree to
          be bound by these Terms. If you do not agree to these Terms, please do not use our
          Services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Eligibility</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            You must be at least 18 years of age to create an account or make donations. Users under
            18 may use certain features (such as student programs) only through a parent, guardian,
            or authorized representative.
          </li>
          <li>By registering, you confirm that all information provided is accurate, current, and complete.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Account Registration and Security</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            You are responsible for maintaining the confidentiality of your login credentials,
            including your username and password.
          </li>
          <li>
            You agree to notify us immediately of any unauthorized use of your account or any other
            breach of security.
          </li>
          <li>
            We reserve the right to suspend or terminate accounts that provide false information,
            violate these Terms, or engage in activity harmful to the community or platform.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Use of the Website</h2>
        <p className="leading-relaxed mb-2">
          You agree to use the website only for lawful purposes and in accordance with these Terms.
          You agree NOT to:
        </p>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>Use the website in any way that violates applicable local, national, or international law.</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
          <li>
            Upload or transmit any content that is unlawful, defamatory, obscene, offensive, or
            infringes on the rights of others.
          </li>
          <li>
            Attempt to gain unauthorized access to any part of the website, other user accounts, or
            connected systems.
          </li>
          <li>Use automated systems (bots, scrapers) to access the website without our prior written permission.</li>
          <li>Interfere with or disrupt the security, integrity, or performance of the website.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Membership and Community Conduct</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            Membership in the {orgName} community is subject to verification and approval at our
            discretion.
          </li>
          <li>
            Members are expected to conduct themselves respectfully toward other members, staff, and
            volunteers in all interactions facilitated through the website.
          </li>
          <li>
            We reserve the right to revoke membership privileges for conduct that violates community
            standards or these Terms.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Donations</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            All donations made through the website are voluntary contributions to support the
            activities and programs of {orgName}.
          </li>
          <li>
            Donation amounts, once processed, are generally non-refundable except as required by
            applicable law or at our sole discretion in cases of error or fraud.
          </li>
          <li>
            Donation receipts will be issued for tax purposes (where applicable) based on the
            information provided by the donor. It is the donor's responsibility to ensure accuracy of
            details provided for receipt generation.
          </li>
          <li>
            We use third-party payment gateways to process donations. We do not store your full
            payment card details on our servers.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Student Sponsorship and Scholarship Programs</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            Information submitted for student sponsorship, scholarship, or support programs will be
            used solely for evaluating eligibility and administering such programs.
          </li>
          <li>
            Approval or continuation of support is subject to our internal policies, available funds,
            and verification of eligibility, and is not guaranteed.
          </li>
          <li>We reserve the right to request additional documentation to verify student information.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            All content on this website, including text, graphics, logos, images, and software, is
            the property of {orgName} or its licensors and is protected by applicable intellectual
            property laws.
          </li>
          <li>
            You may not reproduce, distribute, modify, or create derivative works from any content on
            this website without our prior written consent, except for personal, non-commercial use.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">9. User-Generated Content</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            If the website allows you to submit content (e.g., comments, gallery photos,
            testimonials), you grant {orgName} a non-exclusive, royalty-free, worldwide license to
            use, display, and distribute such content for purposes related to the Association's
            activities.
          </li>
          <li>
            You represent that you have the necessary rights to submit such content and that it does
            not violate any third-party rights.
          </li>
          <li>
            We reserve the right to remove any user-generated content that we deem inappropriate, at
            our sole discretion.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">10. Third-Party Links</h2>
        <p className="leading-relaxed">
          Our website may contain links to third-party websites or services that are not owned or
          controlled by us. We have no control over, and assume no responsibility for, the content,
          privacy policies, or practices of any third-party websites or services. Access to such
          links is at your own risk.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">11. Disclaimer of Warranties</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            The website and its content are provided on an "as is" and "as available" basis, without
            warranties of any kind, either express or implied.
          </li>
          <li>
            We do not warrant that the website will be uninterrupted, error-free, or free of viruses
            or other harmful components.
          </li>
          <li>
            While we strive for accuracy, we make no guarantees regarding the completeness,
            reliability, or accuracy of information on the website, including event details, member
            listings, or donor information.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">12. Limitation of Liability</h2>
        <p className="leading-relaxed">
          To the fullest extent permitted by applicable law, {orgName}, its committee members,
          volunteers, and affiliates shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages arising out of or related to your use of, or inability
          to use, the website or Services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">13. Indemnification</h2>
        <p className="leading-relaxed">
          You agree to indemnify and hold harmless {orgName}, its committee members, volunteers, and
          affiliates from any claims, damages, losses, liabilities, and expenses (including legal
          fees) arising out of your use of the website, violation of these Terms, or infringement of
          any third-party rights.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">14. Termination</h2>
        <p className="leading-relaxed">
          We reserve the right to suspend or terminate your access to the website or any account, at
          our sole discretion, without prior notice, for conduct that we believe violates these Terms
          or is harmful to other users, the Association, or third parties.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">15. Governing Law</h2>
        <p className="leading-relaxed">
          These Terms shall be governed by and construed in accordance with the laws of {jurisdiction},
          without regard to its conflict of law provisions. Any disputes arising under these Terms
          shall be subject to the exclusive jurisdiction of the courts located in {jurisdiction}.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">16. Changes to These Terms</h2>
        <p className="leading-relaxed">
          We reserve the right to modify or update these Terms at any time. Changes will be effective
          immediately upon posting the revised Terms on the website with an updated "Last Updated"
          date. Your continued use of the website after such changes constitutes your acceptance of
          the revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">17. Contact Us</h2>
        <p className="leading-relaxed mb-2">
          For any questions regarding these Terms and Conditions, please contact us at:
        </p>
        <p className="leading-relaxed">
          <strong>{orgName}</strong><br />
          Email: {theme?.email || '[Insert Email Address]'}<br />
          Phone: {theme?.phone || '[Insert Phone Number]'}<br />
        </p>
      </section>
    </div>
  )
}