// src/components/orders/InvoiceViewDialog.tsx
import React, { useState, useMemo, Suspense } from 'react'; // Bỏ Suspense nếu không lazy load InvoicePDF
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

// --- IMPORT TRỰC TIẾP @react-pdf/renderer components ---
import {
  PDFViewer,
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font, // Uncomment nếu bạn đăng ký font
  // Image, // Uncomment nếu bạn dùng Image trong PDF
  pdf, // Để tạo blob cho nút Print (nếu dùng cách đó)
} from '@react-pdf/renderer';

// Interface cho dữ liệu hóa đơn
export interface InvoiceData {
  invoiceId: string;
  orderId: string;
  orderDate: string; // ISO string
  totalAmount: number;
  paymentMethodName?: string;
  items: Array<{
    courseId: number;
    courseName: string;
    priceAtOrder: number;
    instructorName?: string;
  }>;
  customerInfo: {
    fullName: string;
    email: string;
  };
  companyInfo?: {
    name: string;
    address: string;
    email: string;
    phone?: string;
    logoUrl?: string;
  };
}

interface InvoiceViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

try {
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: '/fonts/Roboto-Regular.ttf' },
      { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
      { src: '/fonts/Roboto-Italic.ttf', fontStyle: 'italic' },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]); // Tắt tự động gạch nối nếu cần
  console.log('Fonts for PDF registered successfully.');
} catch (e) {
  console.error('PDF Font registration failed:', e);
}

const pdfStyles = StyleSheet.create({
  // page: { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#333' }, // Mặc định Helvetica
  page: { fontFamily: 'Roboto', fontSize: 10, padding: 40, color: '#333' }, // Nếu dùng Roboto
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
  },
  companyInfo: { textAlign: 'right', maxWidth: '45%' },
  companyName: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' }, // text-blue-600
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#1e293b',
  }, // text-slate-800
  invoiceSubText: { fontSize: 9, color: '#64748b' }, // text-slate-500
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    color: '#334155',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 3,
  }, // text-slate-700, border-slate-300
  billTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  customerName: { fontSize: 11, fontWeight: 'bold', color: '#1e293b' },
  table: {
    width: '100%', // hoặc có thể dùng số, ví dụ: 520
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  }, // border-slate-100
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  }, // bg-slate-50, border-slate-200
  tableColHeaderKey: {
    width: '10%',
    padding: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableColHeaderDesc: {
    width: '60%',
    padding: 6,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  tableColHeaderPrice: {
    width: '30%',
    padding: 6,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  tableCell: { fontSize: 9, padding: 6 },
  tableCellIndex: { textAlign: 'center', width: '10%' },
  tableCellDesc: { textAlign: 'left', width: '60%' },
  tableCellPrice: { textAlign: 'right', width: '30%' },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  totalText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 20,
    color: '#334155',
  },
  totalAmount: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' }, // text-blue-700
  notes: {
    marginTop: 35,
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  // logoImage: { width: 80, height: 'auto', marginBottom: 5, alignSelf: 'flex-end' } // Nếu có logo
});

// Helper: Format tiền tệ
const formatCurrency = (amount: number, currency = 'USD', locale = 'en-US') =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);

// Helper: Format ngày
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMMM dd, yyyy', { locale: vi });
  } catch {
    return 'Invalid Date';
  }
};

const InvoicePDF: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => (
  <Document
    title={`Invoice ${invoice.invoiceId}`}
    author={invoice.companyInfo?.name || '3TEduTech'}
  >
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <View style={pdfStyles.header} fixed>
        <View>
          <Text style={pdfStyles.invoiceTitle}>INVOICE</Text>
          <Text style={pdfStyles.invoiceSubText}>ID: {invoice.invoiceId}</Text>
          <Text style={pdfStyles.invoiceSubText}>
            Order Ref: {invoice.orderId}
          </Text>
        </View>
        <View style={pdfStyles.companyInfo}>
          <Text style={pdfStyles.companyName}>
            {invoice.companyInfo?.name || '3TEduTech'}
          </Text>
          <Text style={pdfStyles.invoiceSubText}>
            {invoice.companyInfo?.address ||
              '123 Learning St, EduCity, EC 12345'}
          </Text>
          <Text style={pdfStyles.invoiceSubText}>
            {invoice.companyInfo?.email || 'billing@3tedutech.com'}
          </Text>
          {invoice.companyInfo?.phone && (
            <Text style={pdfStyles.invoiceSubText}>
              Phone: {invoice.companyInfo.phone}
            </Text>
          )}
        </View>
      </View>

      {/* Bill To & Invoice Info */}
      <View style={pdfStyles.billTo}>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Billed To</Text>
          <Text style={pdfStyles.customerName}>
            {invoice.customerInfo.fullName}
          </Text>
          <Text>{invoice.customerInfo.email}</Text>
        </View>
        <View style={[pdfStyles.section, { textAlign: 'right' }]}>
          <Text style={pdfStyles.sectionTitle}>Invoice Details</Text>
          <Text>Date Issued: {formatDate(invoice.orderDate)}</Text>
          <Text>Payment Method: {invoice.paymentMethodName || 'N/A'}</Text>
        </View>
      </View>

      {/* Table Header */}
      <View style={pdfStyles.table}>
        {' '}
        <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]} fixed>
          <Text style={pdfStyles.tableColHeaderKey}>#</Text>
          <Text style={pdfStyles.tableColHeaderDesc}>Item Description</Text>
          <Text style={pdfStyles.tableColHeaderPrice}>Amount</Text>
        </View>
        {invoice.items.length > 0 ? (
          invoice.items.map((item, index) => (
            <View key={item.courseId} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellIndex]}>
                {index + 1}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellDesc]}>
                {item.courseName}
                {item.instructorName
                  ? ` (Instructor: ${item.instructorName})`
                  : ''}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellPrice]}>
                {formatCurrency(item.priceAtOrder)}
              </Text>
            </View>
          ))
        ) : (
          <View style={pdfStyles.tableRow}>
            <Text style={pdfStyles.tableCell}>No items in this invoice.</Text>
          </View>
        )}
      </View>
      {/* Total */}
      <View style={pdfStyles.footerTotal}>
        <Text style={pdfStyles.totalText}>TOTAL AMOUNT (USD)</Text>
        <Text style={pdfStyles.totalAmount}>
          {formatCurrency(invoice.totalAmount)}
        </Text>
      </View>

      {/* Notes */}
      <View style={pdfStyles.notes} fixed>
        <Text>
          Thank you for choosing 3TEduTech! We appreciate your business.
        </Text>
        <Text>
          If you have any questions concerning this invoice, please contact us
          at {invoice.companyInfo?.email || 'billing@3tedutech.com'}.
        </Text>
      </View>
    </Page>
  </Document>
);
// ----- END PDF Document Component -----

const InvoiceViewDialog: React.FC<InvoiceViewDialogProps> = ({
  open,
  onOpenChange,
  invoice,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdfForPrint, setIsGeneratingPdfForPrint] = useState(false);

  const handlePrint = async () => {
    if (!invoice) return;
    setIsGeneratingPdfForPrint(true); // Bắt đầu tạo blob
    try {
      const pdfDocumentInstance = <InvoicePDF invoice={invoice} />;
      const blob = await pdf(pdfDocumentInstance).toBlob();
      setIsGeneratingPdfForPrint(false); // Kết thúc tạo blob

      if (blob) {
        const pdfUrl = URL.createObjectURL(blob);
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.width = '1px'; // Kích thước nhỏ nhất có thể
        printFrame.style.height = '1px';
        printFrame.style.opacity = '0'; // Ẩn hoàn toàn
        printFrame.style.border = '0';
        printFrame.src = pdfUrl;

        document.body.appendChild(printFrame);

        printFrame.onload = () => {
          try {
            if (printFrame.contentWindow) {
              printFrame.contentWindow.focus(); // Quan trọng cho một số trình duyệt
              printFrame.contentWindow.print();
            } else {
              throw new Error('Cannot access print window content.');
            }
          } catch (e) {
            console.error('Auto-print failed:', e);
            alert(
              'Could not initiate print automatically. Please download the PDF and print it manually.'
            );
          } finally {
            // Cân nhắc xóa iframe sau một khoảng thời gian hoặc khi user đóng dialog
            // setTimeout(() => {
            //   URL.revokeObjectURL(pdfUrl);
            //   document.body.removeChild(printFrame);
            // }, 3000);
          }
        };
      } else {
        throw new Error('Failed to generate PDF blob for printing.');
      }
    } catch (error) {
      console.error('Error in handlePrint:', error);
      alert(
        'Could not prepare the invoice for printing. Please try downloading instead.'
      );
      setIsGeneratingPdfForPrint(false);
    }
  };

  // Tạo instance của PDF document một lần, chỉ khi invoice thay đổi
  const pdfDocumentInstance = useMemo(() => {
    if (!invoice) return null;
    return <InvoicePDF invoice={invoice} />;
  }, [invoice]);

  if (!invoice) return null; // Đảm bảo không render gì nếu không có invoice

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl md:max-w-4xl lg:max-w-5xl w-[calc(100vw-2rem)] sm:w-[95vw] p-0 flex flex-col h-[calc(100vh-4rem)] max-h-[900px] sm:rounded-lg">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl sm:text-2xl font-semibold">
            Invoice <span className="text-primary">#{invoice.invoiceId}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Order #{invoice.orderId} •{' '}
            {format(parseISO(invoice.orderDate), 'MMMM dd, yyyy', {
              locale: vi,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden bg-slate-200 dark:bg-slate-700">
          {pdfDocumentInstance ? ( // Chỉ render PDFViewer nếu có document
            <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
              {pdfDocumentInstance}
            </PDFViewer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Preparing invoice...</p>
            </div>
          )}
        </div>
        <DialogFooter className="p-4 sm:p-6 border-t bg-muted/30 flex-col sm:flex-row sm:justify-end gap-2 bottom-0 z-10">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="w-full sm:w-auto"
          >
            <Icons.printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
          <Suspense
            fallback={
              <Button disabled className="w-full sm:w-auto">
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Preparing PDF...
              </Button>
            }
          >
            <PDFDownloadLink
              document={<InvoicePDF invoice={invoice} />}
              fileName={`Invoice-${invoice.invoiceId}.pdf`}
              className="w-full sm:w-auto"
            >
              {({ blob, url, loading, error }) => (
                <Button
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              )}
            </PDFDownloadLink>
          </Suspense>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewDialog;
