// src/pages/PrivacyPolicyPage.tsx
import React from 'react';
import Layout from '@/components/layout/Layout';
import {
  ChevronRight,
  ShieldAlert,
  FileText,
  Users,
  Info,
  Mail,
  ExternalLink,
  DatabaseZap,
  UserCog,
  Cookie,
  Edit3,
  GitCompareArrows,
  LockKeyhole,
} from 'lucide-react'; // Thêm/thay đổi icons
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'; // Thêm CardDescription
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Icons } from '@/components/common/Icons'; // Để lấy các icon chung nếu cần
import { Button } from '@/components/ui/button';

// Animation Variants
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};
const itemVariants = {
  // Cho các list item nhỏ
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const PrivacyPolicyPage = () => {
  const lastUpdatedDate = 'October 26, 2023'; // Cập nhật ngày này

  // Cấu trúc nội dung được tinh chỉnh và viết lại
  const policySections = [
    {
      id: 'introduction',
      title: 'Our Commitment to Your Privacy',
      icon: (
        <ShieldAlert className="h-7 w-7 mr-3 text-blue-600 dark:text-blue-400" />
      ),
      content: [
        'At 3TEduTech ("3TEduTech", "we", "us", or "our"), your privacy is paramount. This Privacy Policy details our dedication to protecting your personal information when you use our online learning platform, including our website, mobile applications, and related services (collectively, the "Services").',
        'We encourage you to read this policy thoroughly to understand how we collect, use, disclose, and safeguard your data. By accessing or using our Services, you acknowledge you have read and agree to the practices described herein. This policy may be updated periodically, so please review it regularly.',
      ],
    },
    {
      id: 'information-we-collect',
      title: 'The Information We Gather',
      icon: (
        <FileText className="h-7 w-7 mr-3 text-green-600 dark:text-green-400" />
      ),
      description:
        'To provide and enhance our Services, we collect various types of information:',
      subSections: [
        {
          title: '2.1. Information You Provide Directly',
          intro:
            'When you interact with our Services, you may provide us with:',
          list: [
            '<strong>Account & Identity Information:</strong> Such as your full name, username, email address, password, date of birth, profile picture, and any other details you add to your profile.',
            '<strong>Contact Information:</strong> Including your phone number, postal address, and communication preferences for receiving updates from us.',
            '<strong>Financial Information:</strong> Payment card details (which are processed securely by our third-party payment partners and not stored by us directly), purchase history, and transaction records related to course enrollments or instructor payouts.',
            '<strong>Educational & Professional Information:</strong> For learners, this includes course progress, quiz scores, assignment submissions, and certificates earned. For instructors, this encompasses expertise, professional biography, educational background, and content provided for courses.',
            '<strong>User-Generated Content:</strong> Any content you create, share, or post on the Platform, such as forum discussions, course reviews, project submissions, or direct messages.',
            '<strong>Communication Data:</strong> Records of your communications with us, including support tickets, feedback, survey responses, and interactions with our team or other users through the Platform.',
          ],
        },
        {
          title: '2.2. Information Collected Automatically',
          intro:
            'As you navigate and interact with our Services, we may automatically collect:',
          list: [
            '<strong>Technical & Device Information:</strong> Your IP address, approximate geographic location (derived from IP), browser type and version, operating system, device identifiers (like MAC address or advertising ID), and screen resolution.',
            '<strong>Usage & Interaction Data:</strong> Details of your visits to our Platform, including traffic data, pages viewed, features used, time spent on pages, search queries, clickstream data, and interaction with content and advertisements.',
            "<strong>Cookies & Similar Technologies:</strong> We use cookies, web beacons, pixels, and other tracking technologies to operate and personalize our Services, analyze trends, administer the website, track users' movements around the site, and gather demographic information. Please refer to our dedicated Cookie Policy for detailed information.",
          ],
        },
      ],
    },
    {
      id: 'how-we-use-your-information', // Sửa ID cho rõ hơn
      title: 'How We Utilize Your Information',
      icon: (
        <DatabaseZap className="h-7 w-7 mr-3 text-purple-600 dark:text-purple-400" />
      ),
      description:
        'Your information is instrumental in helping us deliver, improve, and secure our Services. Our primary uses include:',
      list: [
        '<strong>Service Provision & Management:</strong> To create and manage your account, deliver and personalize course content, track your learning progress, issue certificates of completion, and facilitate instructor payouts.',
        '<strong>Personalization & Recommendations:</strong> To tailor your learning experience by recommending relevant courses, content, and features based on your interests and past activity.',
        '<strong>Transaction Processing:</strong> To securely process payments for course purchases, subscriptions, and other services, and to manage financial records.',
        '<strong>Communication & Support:</strong> To send you important service-related announcements (e.g., platform maintenance, security updates), course updates, respond to your inquiries, provide customer support, and gather feedback.',
        '<strong>Platform Improvement & Development:</strong> To analyze usage patterns, conduct research and development, identify trends, and enhance the functionality, user experience, and performance of our Services.',
        '<strong>Marketing & Promotional Activities:</strong> With your consent where required, to inform you about new courses, special offers, events, and other news from 3TEduTech that may interest you. You can opt-out of marketing communications at any time.',
        '<strong>Security, Legal & Compliance:</strong> To protect the security and integrity of our Platform, prevent fraud and abuse, investigate potential violations of our terms, comply with legal and regulatory obligations, and enforce our agreements.',
      ],
    },
    {
      id: 'sharing-and-disclosure',
      title: 'Sharing & Disclosure of Information',
      icon: <Users className="h-7 w-7 mr-3 text-red-500 dark:text-red-400" />,
      description:
        'We value your trust and limit the sharing of your personal information. It may be disclosed in the following circumstances:',
      list: [
        '<strong>With Service Providers:</strong> We engage trusted third-party companies and individuals to perform services on our behalf (e.g., payment processing, data hosting and storage, analytics, email delivery, customer support, marketing automation). These providers are contractually obligated to protect your data and only use it for the services they provide to us.',
        '<strong>With Instructors:</strong> To facilitate the educational experience, we share necessary learner information (such as name, enrollment status, and course progress) with the instructors of the courses you are enrolled in.',
        '<strong>With Your Consent or at Your Direction:</strong> We may share your information with third parties when you explicitly consent or direct us to do so (e.g., when connecting your 3TEduTech account with a third-party service).',
        '<strong>For Legal Reasons & Protection:</strong> We may disclose information if required by law, legal process, or governmental request, or if we believe in good faith that such action is necessary to protect the rights, property, or safety of 3TEduTech, our users, or the public.',
        '<strong>In Connection with Business Transfers:</strong> If 3TEduTech undergoes a merger, acquisition, divestiture, or sale of all or a portion of its assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your personal information.',
      ],
      footerContent:
        '<strong>We do not sell your personal data to third parties for their marketing purposes.</strong>',
    },
    {
      id: 'your-data-rights-and-choices',
      title: 'Your Data Rights & Choices',
      icon: (
        <UserCog className="h-7 w-7 mr-3 text-teal-600 dark:text-teal-400" />
      ),
      description:
        'We empower you with control over your personal information. Depending on your jurisdiction, your rights may include:',
      list: [
        '<strong>The Right to Access:</strong> You can request a copy of the personal data we hold about you.',
        '<strong>The Right to Rectification:</strong> You can request to correct or update any inaccurate or incomplete personal data.',
        '<strong>The Right to Erasure (Right to be Forgotten):</strong> You can request the deletion of your personal data under certain conditions.',
        '<strong>The Right to Restrict Processing:</strong> You can request that we limit how we use your personal data.',
        '<strong>The Right to Data Portability:</strong> You can request to receive your personal data in a structured, commonly used, machine-readable format, and to transmit it to another controller.',
        '<strong>The Right to Object:</strong> You can object to the processing of your personal data for certain purposes (e.g., direct marketing).',
        '<strong>The Right to Withdraw Consent:</strong> Where we rely on your consent for processing, you can withdraw it at any time, without affecting the lawfulness of processing based on consent before its withdrawal.',
      ],
      footerContent:
        "To exercise any of these rights, or if you have questions regarding your data, please contact our Data Protection Officer at <a href='mailto:privacy@3tedutech.com' class='text-primary hover:underline font-medium'>privacy@3tedutech.com</a>. We are committed to addressing your requests promptly and in accordance with applicable laws.",
    },
    {
      id: 'cookie-policy-summary',
      title: 'Cookie Policy & Tracking Technologies',
      icon: (
        <Cookie className="h-7 w-7 mr-3 text-orange-500 dark:text-orange-400" />
      ),
      content: [
        'Our Platform utilizes cookies and similar technologies (such as web beacons, pixels, and local storage) to enhance your browsing experience, analyze platform traffic, personalize content, and provide essential functionalities. Cookies are small data files stored on your device.',
        'We use different types of cookies, including strictly necessary cookies (for platform operation), performance cookies (for analytics), functionality cookies (to remember your preferences), and targeting/advertising cookies (if applicable, with your consent).',
        "You have control over your cookie settings through your browser preferences and, where applicable, through our cookie consent management tool. Disabling certain cookies may impact your ability to use some features of our Services. For comprehensive details, please review our full <a href='/cookie-policy' class='text-primary hover:underline font-medium'>Cookie Policy</a>.",
      ],
    },
    {
      id: 'data-security-measures',
      title: 'Our Data Security Measures',
      icon: (
        <LockKeyhole className="h-7 w-7 mr-3 text-indigo-600 dark:text-indigo-400" />
      ),
      content: [
        'The security of your personal data is a top priority. We implement and maintain a variety of industry-standard technical, administrative, and physical security measures designed to protect your information from unauthorized access, use, alteration, disclosure, or destruction. These measures include data encryption, access controls, secure software development practices, regular security audits, and employee training.',
        'While we take extensive precautions, please understand that no method of transmission over the Internet or system of electronic storage is 100% secure. We cannot guarantee absolute security, but we are continuously working to improve our safeguards.',
      ],
    },
    {
      id: 'policy-updates',
      title: 'Updates to This Privacy Policy',
      icon: (
        <GitCompareArrows className="h-7 w-7 mr-3 text-gray-600 dark:text-gray-400" />
      ),
      content: [
        'We may revise this Privacy Policy periodically to reflect changes in our data practices, legal or regulatory requirements, or service offerings. When we make material changes, we will notify you by updating the "Last Updated" date at the top of this policy and, where appropriate, by other means (such as a prominent notice on our Platform or via email).',
        'We encourage you to review this Privacy Policy regularly to stay informed about how we collect, use, and protect your information.',
      ],
    },
  ];

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-100 via-background to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-850/80">
        <div className="container mx-auto px-4 py-10 md:py-16">
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center mb-8 text-sm"
          >
            <Link
              to="/"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-1.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">
              Privacy Policy
            </span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12 md:mb-16 text-center"
          >
            <ShieldAlert className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">
              Our Commitment to Your Privacy
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Last Updated:{' '}
              <span className="font-medium text-foreground">
                {lastUpdatedDate}
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto">
          {policySections.map((section, index) => (
            <motion.section
              key={section.id}
              variants={sectionVariants}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }} // Trigger khi 15% vào view
              className="mb-10 md:mb-14 scroll-mt-24"
              id={section.id} // scroll-mt cho anchor links
            >
              <Card className="overflow-hidden shadow-lg hover:shadow-xl dark:bg-slate-800/60 border dark:border-slate-700/50 rounded-xl transition-shadow duration-300">
                <CardHeader className="border-b dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 p-5 md:p-6">
                  <CardTitle className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 flex items-center">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                  {section.description && (
                    <CardDescription className="text-base pt-1 !mt-1.5 text-slate-600 dark:text-slate-400">
                      {section.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-5 md:p-6 text-slate-700 dark:text-slate-300 space-y-4 leading-relaxed text-base">
                  {section.content?.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      dangerouslySetInnerHTML={{
                        __html: paragraph.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong>$1</strong>'
                        ),
                      }}
                    />
                  ))}
                  {section.subSections?.map((sub, sIndex) => (
                    <div
                      key={sIndex}
                      className={cn(
                        sIndex > 0 &&
                          'mt-6 pt-5 border-t dark:border-slate-700/40'
                      )}
                    >
                      <h3
                        className="text-xl font-semibold mt-0 mb-3 text-foreground dark:text-slate-200"
                        dangerouslySetInnerHTML={{
                          __html: sub.title.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong>$1</strong>'
                          ),
                        }}
                      />
                      {sub.intro && (
                        <p
                          className="mb-2.5 text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: sub.intro.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong>$1</strong>'
                            ),
                          }}
                        />
                      )}
                      {sub.list && (
                        <ul className="list-disc space-y-2.5 pl-5 md:pl-6 marker:text-primary dark:marker:text-primary/80">
                          {sub.list.map((item, lIndex) => (
                            <li
                              key={lIndex}
                              dangerouslySetInnerHTML={{
                                __html: item.replace(
                                  /\*\*(.*?)\*\*/g,
                                  '<strong>$1</strong>'
                                ),
                              }}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {section.list &&
                    !section.subSections && ( // Chỉ render list này nếu không có subSections
                      <ul className="list-disc space-y-2.5 pl-5 md:pl-6 marker:text-primary dark:marker:text-primary/80">
                        {section.list.map((item, lIndex) => (
                          <li
                            key={lIndex}
                            dangerouslySetInnerHTML={{
                              __html: item.replace(
                                /\*\*(.*?)\*\*/g,
                                '<strong>$1</strong>'
                              ),
                            }}
                          />
                        ))}
                      </ul>
                    )}
                  {section.footerContent && (
                    <p
                      className="mt-5 pt-4 border-t dark:border-slate-700/50 text-sm italic text-muted-foreground"
                      dangerouslySetInnerHTML={{
                        __html: section.footerContent.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong>$1</strong>'
                        ),
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </motion.section>
          ))}

          <motion.div
            variants={sectionVariants}
            custom={policySections.length}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-12 md:mt-16 pt-8 md:pt-10 border-t dark:border-slate-700/60 text-center bg-slate-100 dark:bg-slate-800/50 p-8 rounded-xl shadow-inner"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Questions or Concerns?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Your privacy is important to us. If you have any questions about
              this Privacy Policy, our data practices, or wish to exercise your
              rights, please don't hesitate to reach out.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-base group"
            >
              <a href="mailto:privacy@3tedutech.com">
                <Mail className="h-5 w-5 mr-2.5 transition-transform duration-300 group-hover:scale-110" />
                Contact Our Privacy Team
                <ExternalLink className="ml-2 h-4 w-4 opacity-80 group-hover:opacity-100" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
