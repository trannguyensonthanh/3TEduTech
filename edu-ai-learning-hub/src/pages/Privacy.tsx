// src/pages/Privacy.tsx
import Layout from '@/components/layout/Layout';
import {
  ChevronRight,
  ShieldCheck,
  FileText,
  Users,
  Mail,
  DatabaseZap,
  UserCog,
  Cookie,
  GitCompareArrows,
  LockKeyhole,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Hiệu ứng xuất hiện khi cuộn tới
const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const toHtml = (text: string) =>
  text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

/**
 * Trang chính sách quyền riêng tư.
 *
 * Bản trước mở đầu bằng một dải nền chuyển sắc, mỗi mục lại có một biểu tượng
 * mang màu riêng (xanh, lục, tím, đỏ, ngọc, cam, chàm, xám) nên mười mục hiện
 * ra tám màu không mang thông tin gì. Nay mọi biểu tượng dùng chung một sắc độ
 * của màu nhấn, thẻ dùng token nền thẻ và viền mảnh.
 */
const PrivacyPolicyPage = () => {
  const lastUpdatedDate = '26/10/2023';

  const policySections = [
    {
      id: 'introduction',
      title: 'Cam kết của chúng tôi về quyền riêng tư',
      icon: ShieldCheck,
      content: [
        'Tại 3TEduTech, quyền riêng tư của bạn là ưu tiên hàng đầu. Chính sách này mô tả cách chúng tôi bảo vệ thông tin cá nhân khi bạn sử dụng nền tảng học trực tuyến của chúng tôi, bao gồm trang web, ứng dụng di động và các dịch vụ liên quan (gọi chung là "Dịch vụ").',
        'Bạn nên đọc kỹ chính sách này để hiểu chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ dữ liệu của bạn ra sao. Khi truy cập hoặc sử dụng Dịch vụ, bạn xác nhận đã đọc và đồng ý với các thực hành được mô tả ở đây. Chính sách có thể được cập nhật theo thời gian, vì vậy hãy xem lại định kỳ.',
      ],
    },
    {
      id: 'information-we-collect',
      title: 'Thông tin chúng tôi thu thập',
      icon: FileText,
      description:
        'Để cung cấp và cải thiện Dịch vụ, chúng tôi thu thập các loại thông tin sau:',
      subSections: [
        {
          title: '2.1. Thông tin bạn cung cấp trực tiếp',
          intro: 'Khi sử dụng Dịch vụ, bạn có thể cung cấp cho chúng tôi:',
          list: [
            '**Thông tin tài khoản và danh tính:** họ tên, tên đăng nhập, địa chỉ thư điện tử, mật khẩu, ngày sinh, ảnh đại diện và các thông tin khác bạn thêm vào hồ sơ.',
            '**Thông tin liên hệ:** số điện thoại, địa chỉ nhận thư và lựa chọn nhận thông báo từ chúng tôi.',
            '**Thông tin thanh toán:** thông tin thẻ (được xử lý an toàn bởi đối tác thanh toán, chúng tôi không lưu trực tiếp), lịch sử mua hàng và các giao dịch liên quan tới ghi danh khóa học hoặc chi trả cho giảng viên.',
            '**Thông tin học tập và nghề nghiệp:** với học viên là tiến độ học, điểm bài kiểm tra, bài nộp và chứng chỉ đạt được; với giảng viên là chuyên môn, tiểu sử nghề nghiệp, quá trình đào tạo và nội dung khóa học.',
            '**Nội dung do bạn tạo:** bài viết trong diễn đàn, đánh giá khóa học, bài tập nộp lên hoặc tin nhắn trao đổi trên nền tảng.',
            '**Dữ liệu trao đổi:** nội dung liên hệ với chúng tôi, gồm phiếu hỗ trợ, góp ý, câu trả lời khảo sát và tương tác với đội ngũ hoặc người dùng khác.',
          ],
        },
        {
          title: '2.2. Thông tin thu thập tự động',
          intro: 'Khi bạn duyệt và tương tác với Dịch vụ, chúng tôi có thể tự động ghi nhận:',
          list: [
            '**Thông tin kỹ thuật và thiết bị:** địa chỉ IP, vị trí địa lý tương đối suy ra từ IP, loại và phiên bản trình duyệt, hệ điều hành, mã định danh thiết bị và độ phân giải màn hình.',
            '**Dữ liệu sử dụng:** các trang bạn xem, tính năng bạn dùng, thời gian ở lại từng trang, từ khóa tìm kiếm, luồng thao tác và tương tác với nội dung.',
            '**Cookie và công nghệ tương tự:** chúng tôi dùng cookie, thẻ theo dõi và bộ nhớ cục bộ để vận hành và cá nhân hóa Dịch vụ, phân tích xu hướng và ghi nhận cách người dùng di chuyển trong trang. Chi tiết xem trong Chính sách Cookie.',
          ],
        },
      ],
    },
    {
      id: 'how-we-use-your-information',
      title: 'Cách chúng tôi sử dụng thông tin',
      icon: DatabaseZap,
      description:
        'Thông tin của bạn giúp chúng tôi cung cấp, cải thiện và bảo vệ Dịch vụ. Các mục đích chính gồm:',
      list: [
        '**Cung cấp và quản lý dịch vụ:** tạo và quản lý tài khoản, phân phối nội dung khóa học, theo dõi tiến độ học, cấp chứng chỉ hoàn thành và chi trả cho giảng viên.',
        '**Cá nhân hóa và gợi ý:** đề xuất khóa học, nội dung và tính năng phù hợp với sở thích cũng như hoạt động trước đó của bạn.',
        '**Xử lý giao dịch:** thanh toán an toàn cho khóa học, gói đăng ký và các dịch vụ khác, đồng thời quản lý hồ sơ tài chính.',
        '**Liên lạc và hỗ trợ:** gửi thông báo quan trọng về dịch vụ, cập nhật khóa học, trả lời câu hỏi, hỗ trợ khách hàng và thu thập góp ý.',
        '**Cải tiến nền tảng:** phân tích cách sử dụng, nghiên cứu và phát triển, nhận diện xu hướng và nâng cao trải nghiệm cùng hiệu năng của Dịch vụ.',
        '**Tiếp thị:** khi có sự đồng ý của bạn, giới thiệu khóa học mới, ưu đãi, sự kiện và tin tức khác từ 3TEduTech. Bạn có thể ngừng nhận thông tin tiếp thị bất cứ lúc nào.',
        '**An toàn và tuân thủ pháp luật:** bảo vệ tính toàn vẹn của nền tảng, ngăn chặn gian lận, điều tra vi phạm điều khoản và tuân thủ nghĩa vụ pháp lý.',
      ],
    },
    {
      id: 'sharing-and-disclosure',
      title: 'Chia sẻ và tiết lộ thông tin',
      icon: Users,
      description:
        'Chúng tôi hạn chế tối đa việc chia sẻ thông tin cá nhân. Thông tin chỉ được tiết lộ trong các trường hợp sau:',
      list: [
        '**Với nhà cung cấp dịch vụ:** các đối tác thực hiện công việc thay chúng tôi (xử lý thanh toán, lưu trữ dữ liệu, phân tích, gửi thư, hỗ trợ khách hàng). Các đối tác này có nghĩa vụ hợp đồng phải bảo vệ dữ liệu và chỉ dùng cho phần việc được giao.',
        '**Với giảng viên:** chúng tôi chia sẻ thông tin cần thiết của học viên (họ tên, tình trạng ghi danh, tiến độ học) với giảng viên của khóa học bạn tham gia.',
        '**Khi bạn đồng ý hoặc yêu cầu:** ví dụ khi bạn kết nối tài khoản 3TEduTech với một dịch vụ bên thứ ba.',
        '**Vì lý do pháp lý:** khi pháp luật, thủ tục tố tụng hoặc cơ quan nhà nước yêu cầu, hoặc khi cần thiết để bảo vệ quyền, tài sản và an toàn của 3TEduTech, người dùng và cộng đồng.',
        '**Khi chuyển giao doanh nghiệp:** nếu 3TEduTech sáp nhập, mua bán hoặc chuyển nhượng tài sản, thông tin của bạn có thể được chuyển giao. Chúng tôi sẽ thông báo về mọi thay đổi quyền kiểm soát dữ liệu cá nhân.',
      ],
      footerContent:
        '**Chúng tôi không bán dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị của họ.**',
    },
    {
      id: 'your-data-rights-and-choices',
      title: 'Quyền của bạn đối với dữ liệu',
      icon: UserCog,
      description:
        'Bạn có quyền kiểm soát thông tin cá nhân của mình. Tùy theo pháp luật nơi bạn cư trú, các quyền này có thể gồm:',
      list: [
        '**Quyền truy cập:** yêu cầu bản sao dữ liệu cá nhân mà chúng tôi đang lưu giữ.',
        '**Quyền chỉnh sửa:** yêu cầu sửa hoặc cập nhật dữ liệu chưa chính xác, chưa đầy đủ.',
        '**Quyền xóa:** yêu cầu xóa dữ liệu cá nhân trong những điều kiện nhất định.',
        '**Quyền hạn chế xử lý:** yêu cầu chúng tôi thu hẹp phạm vi sử dụng dữ liệu của bạn.',
        '**Quyền chuyển dữ liệu:** nhận dữ liệu của bạn ở định dạng máy đọc được và chuyển sang một bên kiểm soát khác.',
        '**Quyền phản đối:** phản đối việc xử lý dữ liệu cho một số mục đích, ví dụ tiếp thị trực tiếp.',
        '**Quyền rút lại sự đồng ý:** rút lại bất cứ lúc nào, không ảnh hưởng tới tính hợp pháp của việc xử lý trước thời điểm rút.',
      ],
      footerContent:
        "Để thực hiện các quyền trên, hoặc khi có câu hỏi về dữ liệu của bạn, vui lòng liên hệ bộ phận bảo vệ dữ liệu tại <a href='mailto:privacy@3tedutech.com' class='font-medium text-primary hover:underline'>privacy@3tedutech.com</a>. Chúng tôi cam kết phản hồi sớm nhất và đúng quy định pháp luật.",
    },
    {
      id: 'cookie-policy-summary',
      title: 'Cookie và công nghệ theo dõi',
      icon: Cookie,
      content: [
        'Nền tảng sử dụng cookie và các công nghệ tương tự (thẻ theo dõi, điểm ảnh, bộ nhớ cục bộ) để cải thiện trải nghiệm duyệt web, phân tích lưu lượng, cá nhân hóa nội dung và cung cấp những chức năng thiết yếu. Cookie là các tệp dữ liệu nhỏ lưu trên thiết bị của bạn.',
        'Chúng tôi dùng nhiều loại cookie: cookie thiết yếu để nền tảng vận hành, cookie hiệu năng để phân tích, cookie chức năng để ghi nhớ tùy chọn của bạn, và cookie quảng cáo khi có sự đồng ý của bạn.',
        "Bạn có thể kiểm soát cookie qua thiết lập trình duyệt và công cụ quản lý đồng ý của chúng tôi. Việc tắt một số cookie có thể làm giảm khả năng sử dụng vài tính năng. Chi tiết xem trong <a href='/cookie-policy' class='font-medium text-primary hover:underline'>Chính sách Cookie</a>.",
      ],
    },
    {
      id: 'data-security-measures',
      title: 'Biện pháp bảo mật dữ liệu',
      icon: LockKeyhole,
      content: [
        'An toàn dữ liệu cá nhân là ưu tiên hàng đầu. Chúng tôi áp dụng và duy trì nhiều biện pháp kỹ thuật, quản trị và vật lý theo chuẩn ngành nhằm bảo vệ thông tin khỏi truy cập, sử dụng, thay đổi, tiết lộ hoặc phá hủy trái phép: mã hóa dữ liệu, kiểm soát truy cập, quy trình phát triển phần mềm an toàn, kiểm định bảo mật định kỳ và đào tạo nhân sự.',
        'Dù đã hết sức thận trọng, không phương thức truyền tải nào trên Internet hay hệ thống lưu trữ điện tử nào an toàn tuyệt đối. Chúng tôi không thể bảo đảm an toàn tuyệt đối, nhưng liên tục cải thiện các lớp bảo vệ.',
      ],
    },
    {
      id: 'policy-updates',
      title: 'Cập nhật chính sách',
      icon: GitCompareArrows,
      content: [
        'Chúng tôi có thể sửa đổi chính sách này theo thời gian để phản ánh thay đổi trong cách xử lý dữ liệu, yêu cầu pháp lý hoặc phạm vi dịch vụ. Khi có thay đổi quan trọng, chúng tôi sẽ cập nhật ngày "Cập nhật lần cuối" ở đầu trang và thông báo bằng hình thức phù hợp, chẳng hạn thông báo nổi bật trên nền tảng hoặc thư điện tử.',
        'Bạn nên xem lại chính sách này định kỳ để nắm được cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.',
      ],
    },
  ];

  return (
    <Layout>
      <div className='border-b border-border bg-muted/40'>
        <div className='container mx-auto px-4 py-10 md:py-14'>
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='mb-8 flex items-center text-sm'
            aria-label='Đường dẫn'
          >
            <Link
              to='/'
              className='font-medium text-muted-foreground transition-colors hover:text-primary'
            >
              Trang chủ
            </Link>
            <ChevronRight
              className='mx-1.5 h-4 w-4 text-muted-foreground'
              aria-hidden='true'
            />
            <span className='font-medium text-foreground'>
              Chính sách quyền riêng tư
            </span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='text-center'
          >
            <span className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <ShieldCheck className='h-6 w-6' aria-hidden='true' />
            </span>
            <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
              Cam kết của chúng tôi về quyền riêng tư
            </h1>
            <p className='mt-3 text-sm text-muted-foreground'>
              Cập nhật lần cuối:{' '}
              <span className='font-medium text-foreground'>
                {lastUpdatedDate}
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-12 md:py-16'>
        <div className='mx-auto max-w-4xl space-y-8'>
          {policySections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <motion.section
                key={section.id}
                variants={sectionVariants}
                custom={index}
                initial='hidden'
                whileInView='visible'
                viewport={{ once: true, amount: 0.15 }}
                className='scroll-mt-24 rounded-xl border border-border bg-card text-card-foreground'
                id={section.id}
              >
                <header className='border-b border-border px-5 py-4'>
                  <div className='flex items-start gap-3'>
                    <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <SectionIcon className='h-5 w-5' aria-hidden='true' />
                    </span>
                    <div className='min-w-0 space-y-0.5'>
                      <h2 className='text-lg font-semibold'>{section.title}</h2>
                      {section.description && (
                        <p className='text-sm text-muted-foreground'>
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                </header>

                <div className='space-y-4 p-5 text-sm leading-relaxed text-muted-foreground'>
                  {section.content?.map((paragraph, pIndex) => (
                    <p
                      key={pIndex}
                      dangerouslySetInnerHTML={{ __html: toHtml(paragraph) }}
                    />
                  ))}

                  {section.subSections?.map((sub, sIndex) => (
                    <div
                      key={sIndex}
                      className={cn(
                        sIndex > 0 && 'mt-6 border-t border-border pt-5'
                      )}
                    >
                      <h3
                        className='mb-2 text-base font-semibold text-foreground'
                        dangerouslySetInnerHTML={{ __html: toHtml(sub.title) }}
                      />
                      {sub.intro && (
                        <p
                          className='mb-2.5'
                          dangerouslySetInnerHTML={{
                            __html: toHtml(sub.intro),
                          }}
                        />
                      )}
                      {sub.list && (
                        <ul className='list-disc space-y-2 pl-5 marker:text-muted-foreground'>
                          {sub.list.map((item, lIndex) => (
                            <li
                              key={lIndex}
                              dangerouslySetInnerHTML={{
                                __html: toHtml(item),
                              }}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {section.list && !section.subSections && (
                    <ul className='list-disc space-y-2 pl-5 marker:text-muted-foreground'>
                      {section.list.map((item, lIndex) => (
                        <li
                          key={lIndex}
                          dangerouslySetInnerHTML={{ __html: toHtml(item) }}
                        />
                      ))}
                    </ul>
                  )}

                  {section.footerContent && (
                    <p
                      className='mt-5 border-t border-border pt-4 text-sm'
                      dangerouslySetInnerHTML={{
                        __html: toHtml(section.footerContent),
                      }}
                    />
                  )}
                </div>
              </motion.section>
            );
          })}

          <motion.div
            variants={sectionVariants}
            custom={policySections.length}
            initial='hidden'
            whileInView='visible'
            viewport={{ once: true, amount: 0.3 }}
            className='rounded-xl border border-border bg-muted/40 p-8 text-center'
          >
            <h2 className='text-xl font-semibold tracking-tight sm:text-2xl'>
              Bạn còn câu hỏi nào không?
            </h2>
            <p className='mx-auto mt-3 max-w-lg text-sm text-muted-foreground'>
              Nếu bạn có thắc mắc về chính sách này, về cách chúng tôi xử lý dữ
              liệu, hoặc muốn thực hiện các quyền của mình, hãy liên hệ với
              chúng tôi.
            </p>
            <Button asChild size='lg' className='mt-6'>
              <a href='mailto:privacy@3tedutech.com'>
                <Mail className='mr-2 h-4 w-4' aria-hidden='true' />
                Liên hệ bộ phận quyền riêng tư
              </a>
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
