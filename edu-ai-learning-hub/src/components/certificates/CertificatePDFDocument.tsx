// src/components/certificates/CertificatePDFDocument.tsx
import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';

interface CertificatePDFProps {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string; // Format: dd/MM/yyyy
  dynamicCertificateId: string;
  logoUrl?: string; // URL công khai hoặc base64
  signatureImageUrl?: string; // URL công khai hoặc base64
}

// Đăng ký fonts (cần file .ttf của font)
// Bạn cần tải file .ttf của các font này và đặt vào thư mục public hoặc src/assets/fonts
// Ví dụ:
Font.register({
  family: 'Merriweather',
  src: '/fonts/Merriweather-Regular.ttf',
});
Font.register({
  family: 'Merriweather-Bold',
  src: '/fonts/Merriweather-Bold.ttf',
});
Font.register({ family: 'Great Vibes', src: '/fonts/GreatVibes-Regular.ttf' });
Font.register({ family: 'Lato', src: '/fonts/Lato-Regular.ttf' });
Font.register({ family: 'Lato-Bold', src: '/fonts/Lato-Bold.ttf' });
Font.register({ family: 'Open Sans', src: '/fonts/OpenSans-Regular.ttf' });
Font.register({
  family: 'Open Sans-SemiBold',
  src: '/fonts/OpenSans-SemiBold.ttf',
});

// Do giới hạn của môi trường này, tôi không thể tải file font.
// Bạn cần tự thực hiện bước đăng ký font.
// Nếu không đăng ký, PDF sẽ dùng font mặc định (Helvetica).
// Ví dụ đăng ký font (cần có file font thật):
// Giả sử bạn đặt file font trong public/fonts/
const merriweatherRegularUrl = new URL(
  '/fonts/Merriweather-Regular.ttf',
  import.meta.url
).href;
const merriweatherBoldUrl = new URL(
  '/fonts/Merriweather-Bold.ttf',
  import.meta.url
).href;
const greatVibesRegularUrl = new URL(
  '/fonts/GreatVibes-Regular.ttf',
  import.meta.url
).href;
const latoRegularUrl = new URL('/fonts/Lato-Regular.ttf', import.meta.url).href;
const openSansRegularUrl = new URL(
  '/fonts/OpenSans-Regular.ttf',
  import.meta.url
).href;

// console.log("Merriweather Regular URL:", merriweatherRegularUrl); // Để debug đường dẫn

// // Để chạy được ở đây, tôi sẽ comment phần Font.register. BẠN CẦN BỎ COMMENT VÀ CUNG CẤP ĐƯỜNG DẪN ĐÚNG
try {
  Font.register({ family: 'Merriweather', src: merriweatherRegularUrl });
  Font.register({
    family: 'Merriweather-Bold',
    fonts: [{ src: merriweatherBoldUrl, fontWeight: 'bold' }],
  });
  Font.register({ family: 'Great Vibes', src: greatVibesRegularUrl });
  Font.register({ family: 'Lato', src: latoRegularUrl });
  Font.register({ family: 'Open Sans', src: openSansRegularUrl });
  Font.registerHyphenationCallback((word) => [word]); // Tắt tự động gạch nối
  console.log('Fonts registered (or attempted)');
} catch (e) {
  console.error('Font registration failed:', e);
}

// Định nghĩa styles cho PDF (tương tự CSS nhưng có giới hạn)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50, // A4: 210mm x 297mm. 1pt = 1/72 inch. ~595pt x 841pt
    fontFamily: 'Open Sans', // Font mặc định nếu các font khác lỗi
  },
  // ----- Decorative Elements -----
  borderTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 100,
    height: 100,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2563EB', // blue-600
    borderTopLeftRadius: 15,
  },
  borderBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 100,
    height: 100,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#16A34A', // green-600
    borderBottomRightRadius: 15,
  },
  // ----- Content Sections -----
  sectionHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 'auto',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'Merriweather-Bold', // Cần đăng ký font với fontWeight
    color: '#1D4ED8', // blue-700
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: 'Lato',
    color: '#4B5563', // slate-600
    marginBottom: 25,
  },
  studentNameSection: {
    marginVertical: 20,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 42,
    fontFamily: 'Great Vibes',
    color: '#15803D', // green-700
  },
  courseInfoSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  courseLabel: {
    fontSize: 12,
    fontFamily: 'Lato',
    color: '#4B5563',
    marginBottom: 5,
  },
  courseName: {
    fontSize: 22,
    fontFamily: 'Merriweather-Bold',
    color: '#1E293B', // slate-800
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 25,
  },
  detailsSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start', // Để chữ ký và ngày thẳng hàng từ trên
    marginTop: 'auto', // Đẩy xuống dưới
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1', // slate-300
  },
  detailBlock: {
    alignItems: 'center',
    width: '40%',
  },
  signatureImage: {
    width: 120,
    height: 40,
    marginBottom: 3,
  },
  signatureLine: {
    width: 150,
    height: 30, // Để có không gian cho chữ ký và tên
    borderBottomWidth: 1,
    borderBottomColor: '#6B7280', // slate-500
    marginBottom: 5,
    justifyContent: 'flex-end', // Đẩy text xuống dưới line nếu là line
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    fontFamily: 'Open Sans', // Cần đăng ký font Open Sans SemiBold
    color: '#1E293B',
  },
  detailLabel: {
    fontSize: 9,
    fontFamily: 'Lato',
    color: '#6B7280',
  },
  footerSection: {
    position: 'absolute',
    bottom: 25,
    left: 50,
    right: 50,
    textAlign: 'center',
  },
  certificateIdText: {
    fontSize: 9,
    fontFamily: 'Lato',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 15,
  },
  verifyText: {
    fontSize: 7,
    color: '#9CA3AF', // slate-400
    marginTop: 3,
  },
});

export const CertificatePDFDocument: React.FC<CertificatePDFProps> = ({
  studentName,
  courseName,
  instructorName,
  completionDate,
  dynamicCertificateId,
  logoUrl = 'https://i.imgur.com/Fv9X0sX.jpeg', // Đảm bảo URL này public hoặc là base64
  signatureImageUrl,
}) => {
  const { t } = useTranslation();

  return (
    <Document title={`Certificate - ${courseName}`} author='3TEduTech'>
      <Page size='A4' orientation='landscape' style={styles.page}>
        {/* Decorative Borders */}
        <View style={styles.borderTopLeft} fixed />
        <View style={styles.borderBottomRight} fixed />

        {/* Content */}
        <View style={styles.sectionHeader}>
          {/* Sử dụng Image component từ @react-pdf/renderer */}
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
          <Text style={styles.mainTitle}>{t('certificate.title')}</Text>
          <Text style={styles.subTitle}>{t('certificate.presentedTo')}</Text>
        </View>

        <View style={styles.studentNameSection}>
          <Text style={styles.studentName}>{studentName}</Text>
        </View>

        <View style={styles.courseInfoSection}>
          <Text style={styles.courseLabel}>
            {t('certificate.forCompleting')}
          </Text>
          <Text style={styles.courseName}>{courseName}</Text>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailBlock}>
            {signatureImageUrl ? (
              <Image style={styles.signatureImage} src={signatureImageUrl} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <View style={styles.signatureLine}>
              <Text> </Text>
            </View>
            <Text style={styles.detailText}>{instructorName}</Text>
            <Text style={styles.detailLabel}>
              {t('certificate.instructor')}
            </Text>
          </View>
          <View style={styles.detailBlock}>
            <View style={styles.signatureLine}>
              <Text style={styles.detailText}>{completionDate}</Text>
            </View>
            <Text style={styles.detailLabel}>
              {t('certificate.completionDate')}
            </Text>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.certificateIdText}>
            {t('certificate.certificateId', { id: dynamicCertificateId })}
          </Text>
          <Text style={styles.verifyText}>
            {t('certificate.verifyAt', { id: dynamicCertificateId })}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CertificatePDFDocument;
