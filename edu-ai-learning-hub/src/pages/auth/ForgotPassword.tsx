import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/common/Icons";
import { useToast } from "@/components/ui/use-toast";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      // In a real application, this would be an API call to request a password reset
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSuccess(true);

      toast({
        title: "Reset link sent",
        description:
          "If an account exists with this email, you'll receive a password reset link.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset request failed",
        description:
          "There was an error sending the reset link. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-card rounded-lg border shadow-sm p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center mt-4 space-y-2">
                <div>
                  <Link
                    to="/"
                    className="text-sm text-brand-500 hover:underline"
                  >
                    Return to Login
                  </Link>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                  </span>
                  <Link
                    to="/"
                    className="text-sm text-brand-500 hover:underline"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.check className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to{" "}
                <span className="font-medium">{email}</span>. Please check your
                inbox and follow the instructions to reset your password.
              </p>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-left mb-6">
                <div className="flex items-start">
                  <Icons.info className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-800">
                      If you don't see the email in your inbox, please check
                      your spam folder. The link will expire in 30 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsSuccess(false)}
                >
                  Try a different email
                </Button>

                <Link to="/">
                  <Button variant="link" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
