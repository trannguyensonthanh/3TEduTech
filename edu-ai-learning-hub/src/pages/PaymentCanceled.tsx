import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/common/Icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Thanh toán đã bị hủy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Icons.warning className="h-8 w-8 text-yellow-600" />
                </div>

                <h3 className="mt-4 text-xl font-medium">
                  Thanh toán chưa hoàn tất
                </h3>

                <p className="mt-2 text-muted-foreground">
                  Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn chưa được xử
                  lý và bạn chưa bị tính phí.
                </p>

                <div className="mt-6 space-y-3 w-full">
                  <Button
                    onClick={() => navigate("/checkout")}
                    className="w-full"
                  >
                    Thử lại
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/cart")}
                    className="w-full"
                  >
                    Quay lại giỏ hàng
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCanceled;
