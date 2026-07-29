import React, { useState, useEffect } from 'react'

export default function PrivacyPolicy() {
  const [theme, setTheme] = useState({})

  useEffect(() => {
    const colorKeys = ['name', 'email', 'phone', 'address', 'lastUpdatedPrivacy', 'orgJurisdiction']
    const loadedTheme = {}
    colorKeys.forEach((key) => {
      const value = localStorage.getItem(`web_${key}`)
      if (value) loadedTheme[key] = value
    })
    setTheme(loadedTheme)
  }, [])

  const orgName = `${theme?.name || '[Organization Name]'} Parivar`

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        Last Updated: {theme?.lastUpdatedPrivacy || '[Insert Date]'}
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
        <p className="leading-relaxed">
          Welcome to {orgName} ("we," "us," "our," or the "Association"). We are
          committed to protecting the privacy and security of personal information belonging to our
          members, donors, students, and website visitors (collectively, "you" or "users").
        </p>
        <p className="leading-relaxed mt-2">
          This Privacy Policy explains how we collect, use, store, share, and protect your personal
          information when you visit our website, register for an account, make donations, or
          otherwise interact with our services.
        </p>
        <p className="leading-relaxed mt-2">
          By accessing or using our website, you agree to the terms of this Privacy Policy. If you do
          not agree, please discontinue use of our website and services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
        <h3 className="font-medium mt-3 mb-1">2.1 Information You Provide Directly</h3>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            <strong>Account/Registration Information</strong>: Name, email address, phone number,
            password, date of birth, gender, address, and profile photograph.
          </li>
          <li>
            <strong>Member/Family Details</strong>: Information about family members, relationships,
            and community affiliation as required for membership records.
          </li>
          <li>
            <strong>Donor Information</strong>: Name, contact details, payment information, donation
            history, and PAN/tax-related details (where applicable for tax receipts).
          </li>
          <li>
            <strong>Student Information</strong>: Academic details, institution name, course of
            study, and related information for scholarship or sponsorship programs.
          </li>
          <li>
            <strong>Communications</strong>: Information you provide when contacting us via forms,
            email, or messaging features.
          </li>
        </ul>

        <h3 className="font-medium mt-3 mb-1">2.2 Information Collected Automatically</h3>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            <strong>Device and Usage Data</strong>: IP address, browser type, device type, operating
            system, pages visited, and time spent on the website.
          </li>
          <li>
            <strong>Cookies and Tracking Technologies</strong>: We use cookies and similar
            technologies to enhance user experience, remember preferences, and analyze website
            traffic.
          </li>
        </ul>

        <h3 className="font-medium mt-3 mb-1">2.3 Information from Third Parties</h3>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>Information from social media platforms if you choose to log in or link your account.</li>
          <li>
            Payment confirmation details from payment gateway providers when you make donations or
            payments.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>To create and manage your account and provide access to member-only features.</li>
          <li>To process donations, issue receipts, and maintain donor records.</li>
          <li>
            To communicate with you regarding events, announcements, newsletters, and community
            updates.
          </li>
          <li>
            To verify eligibility for student scholarships, sponsorships, or other support programs.
          </li>
          <li>To improve our website, services, and user experience.</li>
          <li>To send notifications related to your account activity.</li>
          <li>To comply with applicable legal, regulatory, and tax obligations.</li>
          <li>To prevent fraud, unauthorized access, and ensure the security of our platform.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Legal Basis for Processing</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li><strong>Consent</strong>: When you register, provide information, or opt in to communications.</li>
          <li><strong>Legitimate Interest</strong>: To operate and improve our services and maintain community records.</li>
          <li><strong>Legal Obligation</strong>: To comply with applicable laws, including tax and financial reporting requirements for donations.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. How We Share Your Information</h2>
        <p className="leading-relaxed mb-2">
          We do not sell, rent, or trade your personal information to third parties for marketing
          purposes. We may share your information in the following limited circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            <strong>Service Providers</strong>: With trusted third-party vendors who assist us in
            operating the website, processing payments, or sending communications (e.g., payment
            gateways, email service providers).
          </li>
          <li>
            <strong>Legal Requirements</strong>: When required by law, regulation, court order, or
            governmental request.
          </li>
          <li>
            <strong>Organizational Operations</strong>: With authorized committee members or
            administrators for managing membership, donations, and community activities.
          </li>
          <li>
            <strong>Business Transfers</strong>: In the event of a merger, restructuring, or transfer
            of assets, your information may be transferred as part of that transaction, subject to
            confidentiality obligations.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Data Storage and Security</h2>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>
            We implement reasonable administrative, technical, and physical security measures to
            protect your personal information from unauthorized access, alteration, disclosure, or
            destruction.
          </li>
          <li>Passwords are stored in encrypted/hashed form and are never visible to administrators.</li>
          <li>
            Despite our efforts, no method of transmission over the internet or electronic storage is
            100% secure. We cannot guarantee absolute security.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Data Retention</h2>
        <p className="leading-relaxed mb-2">
          We retain your personal information for as long as necessary to fulfill the purposes
          outlined in this Privacy Policy, including:
        </p>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>Maintaining active membership and account records.</li>
          <li>
            Complying with legal, accounting, or tax reporting obligations (especially for donation
            records).
          </li>
          <li>Resolving disputes and enforcing agreements.</li>
        </ul>
        <p className="leading-relaxed mt-2">
          You may request deletion of your account and associated data, subject to our legal
          retention obligations, by contacting us using the details provided in Section 11.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Your Rights</h2>
        <p className="leading-relaxed mb-2">Depending on applicable law, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li><strong>Access</strong> the personal information we hold about you.</li>
          <li><strong>Correct</strong> inaccurate or incomplete information.</li>
          <li><strong>Request Deletion</strong> of your personal data, subject to legal retention requirements.</li>
          <li><strong>Withdraw Consent</strong> for processing based on consent, including unsubscribing from communications.</li>
          <li><strong>Object</strong> to certain types of processing.</li>
          <li><strong>Request Data Portability</strong> in a structured, commonly used format.</li>
        </ul>
        <p className="leading-relaxed mt-2">
          To exercise any of these rights, please contact us using the details in Section 11.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">9. Cookies Policy</h2>
        <p className="leading-relaxed mb-2">Our website uses cookies to:</p>
        <ul className="list-disc pl-6 space-y-1 leading-relaxed">
          <li>Remember your login session and preferences.</li>
          <li>Analyze website traffic and usage patterns.</li>
          <li>Improve overall website functionality.</li>
        </ul>
        <p className="leading-relaxed mt-2">
          You can control or disable cookies through your browser settings. Please note that
          disabling cookies may affect the functionality of certain features, including login and
          personalized content.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">10. Children's Privacy</h2>
        <p className="leading-relaxed mb-2">
          Our services, particularly student sponsorship and scholarship programs, may involve
          information about minors provided by their parents, guardians, or educational
          institutions. We handle such information with additional care and only collect what is
          necessary for the stated purpose, with appropriate consent from a parent or guardian.
        </p>
        <p className="leading-relaxed">
          We do not knowingly allow minors to independently create accounts or provide personal
          information without parental/guardian consent.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">11. Contact Us</h2>
        <p className="leading-relaxed mb-2">
          If you have any questions, concerns, or requests regarding this Privacy Policy or your
          personal information, please contact us at:
        </p>
        <p className="leading-relaxed">
          <strong>{orgName}</strong><br />
          Email: {theme?.email || '[Insert Email Address]'}<br />
          Phone: {theme?.phone || '[Insert Phone Number]'}<br />

        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">12. Changes to This Privacy Policy</h2>
        <p className="leading-relaxed">
          We may update this Privacy Policy from time to time to reflect changes in our practices,
          legal requirements, or services. We will notify users of significant changes by posting the
          updated policy on our website with a revised "Last Updated" date. Continued use of our
          website after such changes constitutes your acceptance of the updated policy.
        </p>
      </section>
    </div>
  )
}