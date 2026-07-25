// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

const socialLinks = [
  { name: 'Facebook', href: '#', icon: <Icons.facebook className='h-5 w-5' /> },
  { name: 'Twitter', href: '#', icon: <Icons.twitter className='h-5 w-5' /> },
  {
    name: 'Instagram',
    href: '#',
    icon: <Icons.instagram className='h-5 w-5' />,
  },
  { name: 'YouTube', href: '#', icon: <Icons.youtube className='h-5 w-5' /> },
  { name: 'LinkedIn', href: '#', icon: <Icons.linkedin className='h-5 w-5' /> },
];

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const footerSectionsI18n = [
    {
      title: t('footer.explore'),
      links: [
        { label: t('footer.allCourses'), href: '/courses' },
        { label: t('footer.categories'), href: '/categories' },
        { label: t('footer.instructors'), href: '/instructors' },
        { label: t('footer.freeCourses'), href: '/courses?isFree=true' },
        {
          label: t('footer.newReleases'),
          href: '/courses?sortBy=createdAt:desc',
        },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.aboutUs'), href: '/about' },
        { label: t('footer.blog'), href: '/blog' },
        { label: t('footer.careers'), href: '/careers' },
        { label: t('footer.press'), href: '/press' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.helpCenter'), href: '/help' },
        { label: t('footer.contactUs'), href: '/contact' },
        { label: t('footer.faq'), href: '/faq' },
        { label: t('footer.communityForum'), href: '/forum' },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { label: t('footer.termsOfService'), href: '/terms' },
        { label: t('footer.privacyPolicy'), href: '/privacy' },
        { label: t('footer.cookiePolicy'), href: '/cookies' },
      ],
    },
  ];

  return (
    <footer className='footer-premium text-slate-600 dark:text-slate-400 relative'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16'>
        {/* Top Section */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-12 items-start'>
          <div className='lg:col-span-4'>
            <Link to='/' className='flex items-center space-x-2.5 mb-4 group'>
              <Icons.logo className='h-9 w-9 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6' />
              <span className='text-2xl font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors'>
                3TEduTech
              </span>
            </Link>
            <p className='text-sm leading-relaxed mb-6 max-w-sm text-slate-500 dark:text-slate-400'>
              {t('footer.slogan')}
            </p>
            <div className='flex space-x-3'>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={t(`footer.social.${social.name.toLowerCase()}`)}
                  className='w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-105'
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Columns */}
          {footerSectionsI18n.slice(0, 2).map((section) => (
            <div key={section.title} className='lg:col-span-2'>
              <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wider uppercase mb-5'>
                {section.title}
              </h3>
              <ul className='space-y-3'>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className='text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 relative group'
                    >
                      <span className='relative'>
                        {link.label}
                        <span className='absolute bottom-0 left-0 w-0 h-[1px] bg-blue-500 transition-all duration-300 group-hover:w-full' />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className='lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12'>
            {footerSectionsI18n.slice(2).map((section) => (
              <div key={section.title} className='sm:col-span-1'>
                <h3 className='text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-wider uppercase mb-5'>
                  {section.title}
                </h3>
                <ul className='space-y-3'>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className='text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 relative group'
                      >
                        <span className='relative'>
                          {link.label}
                          <span className='absolute bottom-0 left-0 w-0 h-[1px] bg-blue-500 transition-all duration-300 group-hover:w-full' />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className='dark:bg-slate-800/80' />

        {/* Bottom Section */}
        <div className='mt-8 md:mt-10 flex flex-col sm:flex-row justify-between items-center text-xs'>
          <p className='text-slate-400 dark:text-slate-500 mb-4 sm:mb-0'>
            {t('footer.copyright', { year })}
          </p>
          <div className='flex items-center space-x-1'>
            <span className='text-slate-400 dark:text-slate-500'>
              Made with
            </span>
            <span className='text-red-400 animate-pulse text-sm'>♥</span>
            <span className='text-slate-400 dark:text-slate-500'>
              by 3TEduTech Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
