// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

/**
 * Chân trang.
 *
 * Bản trước dùng lớp `footer-premium` (chuyển sắc riêng trong App.css) cùng
 * thang xám và thang lam tự chế. Nay chỉ còn nền nhạt `bg-muted/40`, một đường
 * kẻ `border-border` phân tách với nội dung, và màu nhấn cho trạng thái di chuột.
 */
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
    <footer className='border-t border-border bg-muted/40'>
      <div className='container mx-auto px-4 py-12 sm:px-6 md:py-16 lg:px-8'>
        {/* Khối trên */}
        <div className='mb-10 grid grid-cols-1 items-start gap-8 md:mb-12 md:gap-12 lg:grid-cols-12'>
          <div className='lg:col-span-4'>
            <Link to='/' className='group mb-4 flex items-center space-x-2.5'>
              <Icons.logo className='h-9 w-9 text-primary' />
              <span className='text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary'>
                3TEduTech
              </span>
            </Link>
            <p className='mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground'>
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
                  className='flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-primary'
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Các cột liên kết */}
          {footerSectionsI18n.slice(0, 2).map((section) => (
            <div key={section.title} className='lg:col-span-2'>
              <h3 className='mb-5 text-sm font-semibold uppercase tracking-wider text-foreground'>
                {section.title}
              </h3>
              <ul className='space-y-3'>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className='text-sm text-muted-foreground transition-colors hover:text-primary'
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-12 lg:col-span-4'>
            {footerSectionsI18n.slice(2).map((section) => (
              <div key={section.title} className='sm:col-span-1'>
                <h3 className='mb-5 text-sm font-semibold uppercase tracking-wider text-foreground'>
                  {section.title}
                </h3>
                <ul className='space-y-3'>
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className='text-sm text-muted-foreground transition-colors hover:text-primary'
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Khối dưới */}
        <div className='mt-8 flex flex-col items-center justify-between text-xs text-muted-foreground sm:flex-row md:mt-10'>
          <p className='mb-4 sm:mb-0'>{t('footer.copyright', { year })}</p>
          <p>{t('footer.madeBy', 'Được thực hiện bởi đội ngũ 3TEduTech')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
