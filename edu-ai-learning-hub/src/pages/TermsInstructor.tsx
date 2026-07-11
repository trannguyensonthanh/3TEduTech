// src/pages/InstructorTermsPage.tsx
import React from 'react';
import Layout from '@/components/layout/Layout';
import {
  ChevronRight,
  FileSignature,
  Users,
  BookOpenCheck,
  ShieldCheck,
  BarChartBig,
  Copyright,
  UserX,
  History,
  Mail,
  ExternalLink,
} from 'lucide-react'; // Thêm các icon phù hợp
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Icons } from '@/components/common/Icons'; // Để lấy các icon chung nếu cần
import { Button } from '@/components/ui/button';

// Animation Variants (Tương tự PrivacyPolicyPage)
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

interface PolicySubSection {
  title: string;
  content?: string[];
  list?: string[];
}

interface PolicySection {
  id: string;
  title: string;
  icon: JSX.Element;
  description?: string;
  content?: string[];
  list?: string[];
  subSections?: PolicySubSection[];
  footerContent?: string;
}

const InstructorTermsPage = () => {
  const lastUpdatedDate = 'October 26, 2023'; // Cập nhật ngày này

  const termsSections: PolicySection[] = [
    {
      id: 'introduction',
      title: '1. Welcome to the 3TEduTech Instructor Community',
      icon: (
        <FileSignature className="h-7 w-7 mr-3 text-blue-600 dark:text-blue-400" />
      ),
      content: [
        'These Instructor Terms ("Terms") govern your participation as an instructor ("Instructor", "you", or "your") on the 3TEduTech online learning platform (the "Platform"), operated by 3TEduTech ("we", "us", or "our"). By registering as an Instructor and submitting content, you agree to be bound by these Terms, our general <a href=\'/terms\' class=\'text-primary hover:underline font-medium\'>Terms of Service</a>, and our <a href=\'/privacy\' class=\'text-primary hover:underline font-medium\'>Privacy Policy</a>.',
        'This is a legally binding agreement. Please read these Terms carefully. If you do not agree to these Terms, you may not use the Platform as an Instructor.',
      ],
    },
    {
      id: 'definitions',
      title: '2. Key Definitions',
      icon: (
        <Icons.bookOpen className="h-7 w-7 mr-3 text-indigo-600 dark:text-indigo-400" />
      ),
      list: [
        '<strong>Instructor:</strong> An individual or entity approved by 3TEduTech to create, submit, and manage educational content on the Platform.',
        '<strong>Submitted Content:</strong> All educational materials provided by you, including but not limited to course videos, lectures, quizzes, coding exercises, assignments, resources, and any related promotional materials.',
        '<strong>Student:</strong> A registered user who enrolls in or purchases access to Submitted Content.',
        '<strong>Platform:</strong> The 3TEduTech website, mobile applications, APIs, and all associated services and technologies.',
        '<strong>Base Price:</strong> The underlying price for your Submitted Content set by you, before any platform discounts or promotions.',
        '<strong>Net Revenue:</strong> The amount 3TEduTech receives from a Student for your Submitted Content, less any applicable taxes, payment processing fees (e.g., credit card fees), mobile platform fees (e.g., Apple App Store or Google Play fees), and any amounts paid for affiliate marketing or promotional programs you opt into.',
      ],
    },
    {
      id: 'instructor-obligations',
      title: '3. Your Responsibilities as an Instructor',
      icon: (
        <Users className="h-7 w-7 mr-3 text-green-600 dark:text-green-400" />
      ),
      description:
        'As a valued member of our instructor community, you agree to:',
      list: [
        'Provide and maintain accurate, complete, and up-to-date information in your instructor profile and payment accounts.',
        'Ensure all Submitted Content is your original work or that you have secured all necessary licenses, rights, consents, and permissions to use and grant us the rights outlined in these Terms.',
        "Deliver high-quality, engaging, and educationally sound Submitted Content that meets 3TEduTech's quality standards and community guidelines, which may be updated from time to time.",
        'Respond professionally and in a timely manner (e.g., within 24-48 hours) to Student inquiries and feedback related to your Submitted Content.',
        'Not upload or distribute any Submitted Content that is unlawful, defamatory, infringing, obscene, harmful, or otherwise objectionable.',
        'Comply with all applicable laws, rules, and regulations, including those related to data privacy and intellectual property.',
        'Maintain the security and confidentiality of your instructor account credentials.',
      ],
    },
    {
      id: 'content-submission-and-quality',
      title: '4. Submitted Content: Standards and Review',
      icon: (
        <BookOpenCheck className="h-7 w-7 mr-3 text-teal-600 dark:text-teal-400" />
      ),
      content: [
        "All Submitted Content must adhere to 3TEduTech's course quality checklist and content guidelines. We aim to provide a high-value learning experience for all Students.",
      ],
      list: [
        '<strong>Educational Value:</strong> Content must be accurate, comprehensive, and offer clear learning objectives and outcomes.',
        '<strong>Production Quality:</strong> Video and audio must meet minimum quality standards for clarity and legibility. Supplementary materials should be well-organized.',
        '<strong>No Misleading Information:</strong> Course descriptions, titles, and promotional materials must accurately reflect the content and learning outcomes.',
        '<strong>Respectful Environment:</strong> Content must not promote discrimination, hate speech, or harassment.',
      ],
      footerContent:
        '3TEduTech reserves the right, but not the obligation, to review, screen, reject, or remove any Submitted Content at our sole discretion, with or without notice, if it violates these Terms or our platform policies, or if it is deemed inappropriate or low quality.',
    },
    {
      id: 'revenue-share-and-payments',
      title: '5. Revenue Share, Pricing, and Payments',
      icon: (
        <BarChartBig className="h-7 w-7 mr-3 text-orange-500 dark:text-orange-400" />
      ),
      description: 'We believe in a fair partnership with our instructors.',
      subSections: [
        {
          title: '5.1. Price Setting',
          content: [
            'As an instructor, you may set the Base Price for your Submitted Content from a range of price tiers provided by 3TEduTech. You may also choose to offer your content for free. We may offer platform-wide discounts and promotions which could affect the final sale price.',
          ],
        },
        {
          title: '5.2. Revenue Share',
          content: [
            "Our standard revenue share is <strong>70% of Net Revenue to you</strong>, the Instructor, and 30% to 3TEduTech for sales made through organic platform discovery or your direct promotion (e.g., using your instructor coupon code). For sales driven by 3TEduTech's paid advertising or affiliate channels, the revenue share may differ, as outlined in specific promotional program terms you opt into. All revenue shares are calculated based on Net Revenue.",
          ],
        },
        {
          title: '5.3. Payouts',
          content: [
            'Instructor payouts are processed monthly (e.g., within 45 days after the end of the month in which the qualifying sale was made) via your chosen payment method (e.g., PayPal, Payoneer), provided your accrued earnings meet the minimum payout threshold (e.g., $50 USD). You are responsible for any fees charged by your payment provider and for providing accurate payment information.',
          ],
        },
      ],
    },
    {
      id: 'intellectual-property-rights',
      title: '6. Intellectual Property Rights',
      icon: (
        <Copyright className="h-7 w-7 mr-3 text-yellow-500 dark:text-yellow-400" />
      ),
      content: [
        '<strong>Your Content, Your Ownership:</strong> You retain all intellectual property rights to your Submitted Content. We do not claim any ownership rights to your materials.',
        '<strong>License to 3TEduTech:</strong> By submitting content, you grant 3TEduTech a worldwide, non-exclusive, royalty-free, sublicensable license to use, host, reproduce, distribute, publicly perform, publicly display, modify (for formatting or accessibility purposes), and promote your Submitted Content on and through the Platform, and in our marketing and promotional activities. This license terminates when you remove your content from the Platform, or your instructor account is terminated, except for rights granted to enrolled Students.',
        '<strong>Student License:</strong> You grant enrolled Students a limited, non-exclusive, non-transferable license to access and view your Submitted Content for their personal, non-commercial, educational purposes through the Platform, in accordance with our general Terms of Service.',
      ],
    },
    {
      id: 'termination',
      title: '7. Termination and Account Deactivation',
      icon: <UserX className="h-7 w-7 mr-3 text-pink-600 dark:text-pink-400" />,
      list: [
        '<strong>By You:</strong> You may terminate your instructor relationship with 3TEduTech at any time by providing written notice and unpublishing your courses, subject to any ongoing obligations to enrolled Students.',
        '<strong>By 3TEduTech:</strong> We reserve the right to terminate or suspend your Instructor account and access to the Platform, with or without prior notice, for any breach of these Terms, including but not limited to: violations of content standards, intellectual property infringement, fraudulent activities, prolonged inactivity, or conduct detrimental to the 3TEduTech community.',
        '<strong>Effect of Termination:</strong> Upon termination, your Submitted Content may be removed from public availability (though enrolled Students may retain access to content they have paid for). Any accrued unpaid earnings will be paid out according to the normal payment schedule, provided they meet the minimum threshold and are not associated with fraudulent activity.',
      ],
    },
    {
      id: 'modifications-to-terms',
      title: '8. Modifications to These Terms',
      icon: (
        <History className="h-7 w-7 mr-3 text-gray-600 dark:text-gray-400" />
      ),
      content: [
        '3TEduTech reserves the right to modify or replace these Instructor Terms at any time at its sole discretion. We will provide reasonable notice of any material changes, typically by posting the updated Terms on the Platform and/or sending an email notification to your registered email address. The "Last Updated" date at the top of these Terms will indicate when the latest modifications were made.',
        'Your continued use of the Platform as an Instructor after such modifications become effective constitutes your acceptance of the new Terms. If you do not agree to the new terms, you must stop using the Platform as an Instructor and terminate your account.',
      ],
    },
  ];

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-100 via-background to-background dark:from-slate-900 dark:via-slate-800 dark:to-slate-850/80 ">
        <div className="container mx-auto px-4 py-10 md:py-16 ">
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
              Instructor Terms
            </span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12 md:mb-16 text-center"
          >
            <FileSignature className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">
              Instructor Terms of Service
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
          {termsSections.map((section, index) => (
            <motion.section
              key={section.id}
              variants={sectionVariants}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="mb-10 md:mb-12 scroll-mt-24"
              id={section.id}
            >
              <Card className="overflow-hidden shadow-lg hover:shadow-xl dark:bg-slate-800/60 border dark:border-slate-700/50 rounded-xl transition-shadow duration-300">
                <CardHeader className="border-b dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 p-5 md:p-6">
                  <CardTitle className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center">
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
                        __html: paragraph
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(
                            /\[(.*?)\]\((.*?)\)/g,
                            '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-medium">$1</a>'
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
                      {/* KIỂM TRA sub.content TRƯỚC KHI MAP */}
                      {sub.content?.map((p, pIdx) => (
                        <p
                          key={pIdx}
                          className="mb-2.5"
                          dangerouslySetInnerHTML={{
                            __html: p.replace(
                              /\*\*(.*?)\*\*/g,
                              '<strong>$1</strong>'
                            ),
                          }}
                        />
                      ))}
                      {/* KIỂM TRA sub.list TRƯỚC KHI MAP */}
                      {sub?.list && (
                        <ul className="list-disc space-y-2.5 pl-5 md:pl-6 marker:text-primary dark:marker:text-primary/80">
                          {sub?.list.map((item, lIndex) => (
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

                  {/* Render section.list nếu không có subSections */}
                  {section.list && !section.subSections && (
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
            custom={termsSections.length}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mt-12 md:mt-16 pt-8 md:pt-10 border-t dark:border-slate-700/60 text-center bg-slate-100 dark:bg-slate-800/50 p-8 rounded-xl shadow-inner"
          >
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Questions Regarding These Terms?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              If you have any inquiries or require clarification regarding these
              Instructor Terms, please feel free to reach out to our legal team.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-base group"
            >
              <a href="mailto:legal@3tedutech.com">
                {' '}
                {/* Thay bằng email thật */}
                <Mail className="h-5 w-5 mr-2.5 transition-transform duration-300 group-hover:scale-110" />
                Contact Legal Support
                <ExternalLink className="ml-2 h-4 w-4 opacity-80 group-hover:opacity-100" />
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default InstructorTermsPage;
