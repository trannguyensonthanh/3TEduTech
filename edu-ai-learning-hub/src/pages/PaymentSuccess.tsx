import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/common/Icons";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  // Simulate clearing cart if it wasn't already cleared
  useEffect(() => {
    // In a real implementation, you might want to verify the order status here
    // by making an API call using an order ID from URL params
  }, []);

  return (
    <Layout>
      <div className="container mx-auto py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Icons.check className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="mt-6 text-3xl font-bold">Thanh toán thành công!</h1>

          <p className="mt-4 text-muted-foreground">
            Cảm ơn bạn đã mua khóa học. Đơn hàng của bạn đã được xác nhận và đã
            được thêm vào tài khoản của bạn.
          </p>

          <div className="mt-8 space-y-4">
            <Button
              onClick={() => navigate("/my-courses")}
              className="w-full"
              size="lg"
            >
              Xem khóa học của tôi
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/courses")}
              className="w-full"
            >
              Tiếp tục mua sắm
            </Button>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-muted">
            <div className="flex items-start">
              <Icons.info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-left">
                <p>
                  Email xác nhận sẽ được gửi đến địa chỉ email của bạn kèm theo
                  chi tiết đơn hàng.
                </p>
                <p className="mt-1">
                  Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận hỗ
                  trợ của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
