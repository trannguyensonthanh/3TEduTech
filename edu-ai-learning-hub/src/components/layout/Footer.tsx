// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons'; // Cần: logo, facebook, twitter, instagram, youtube, linkedin (nếu có)
import { Input } from '@/components/ui/input'; // Cho newsletter (tùy chọn)
import { Button } from '@/components/ui/button'; // Cho newsletter (tùy chọn)
import { Separator } from '@/components/ui/separator'; // Để tạo đường kẻ
import { cn } from '@/lib/utils';
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
  { name: 'LinkedIn', href: '#', icon: <Icons.linkedin className='h-5 w-5' /> }, // Thêm LinkedIn
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
    <footer className='bg-slate-50 dark:bg-slate-900 border-t border-border/60 dark:border-slate-800 text-slate-700 dark:text-slate-400'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16'>
        {/* Top Section: Logo, Description, Social Links, Newsletter (Optional) */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mb-10 md:mb-12 items-start'>
          <div className='lg:col-span-4'>
            <Link to='/' className='flex items-center space-x-2.5 mb-4 group'>
              <Icons.logo className='h-9 w-9 text-primary transition-transform duration-300 group-hover:scale-110' />
              <span className='text-2xl font-bold text-foreground dark:text-slate-100 group-hover:text-primary transition-colors'>
                3TEduTech
              </span>
            </Link>
            <p className='text-sm leading-relaxed mb-6 max-w-sm'>
              {t('footer.slogan')}
            </p>
            <div className='flex space-x-4'>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={t(`footer.social.${social.name.toLowerCase()}`)}
                  className='text-muted-foreground hover:text-primary dark:hover:text-primary/90 transition-colors'
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links Columns - Bắt đầu từ lg:col-span-2 */}
          {footerSectionsI18n.slice(0, 2).map(
            (
              section // Hai cột đầu
            ) => (
              <div key={section.title} className='lg:col-span-2'>
                <h3 className='text-base font-semibold text-foreground dark:text-slate-200 tracking-wider uppercase mb-5'>
                  {section.title}
                </h3>
                <ul className='space-y-3'>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className='text-sm hover:text-primary dark:hover:text-primary/90 transition-colors hover:underline'
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {/* Hai cột sau có thể gộp lại hoặc một cột cho newsletter */}
          <div className='lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-12'>
            {footerSectionsI18n.slice(2).map(
              (
                section // Hai cột còn lại
              ) => (
                <div key={section.title} className='sm:col-span-1'>
                  <h3 className='text-base font-semibold text-foreground dark:text-slate-200 tracking-wider uppercase mb-5'>
                    {section.title}
                  </h3>
                  <ul className='space-y-3'>
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          className='text-sm hover:text-primary dark:hover:text-primary/90 transition-colors hover:underline'
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>

        <Separator className='dark:bg-slate-700/70' />

        {/* Bottom Section: Copyright and Utility Links */}
        <div className='mt-8 md:mt-10 flex flex-col sm:flex-row justify-between items-center text-xs'>
          <p className='text-muted-foreground mb-4 sm:mb-0'>
            {t('footer.copyright', { year })}
          </p>
          <div className='flex space-x-4'>
            {/* Các link tiện ích nhỏ ở đây nếu cần, ví dụ: */}
            {/* <Link to="/sitemap" className="hover:text-primary dark:hover:text-primary/90 transition-colors">Sitemap</Link> */}
            {/* <Link to="/accessibility" className="hover:text-primary dark:hover:text-primary/90 transition-colors">Accessibility</Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
