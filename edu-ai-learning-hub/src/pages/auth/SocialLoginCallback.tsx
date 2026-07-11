import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/common/Icons";

const SocialLoginCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the access token from the URL query parameters
        const params = new URLSearchParams(location.search);
        const accessToken = params.get("accessToken");
        const provider = params.get("provider") || "social";

        if (!accessToken) {
          throw new Error("No access token provided");
        }

        // In a real application, you would validate the token with your backend
        // and get user data. For this demo, we'll just simulate a successful login.

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Create mock user data based on provider
        const userData = {
          email: `user@${provider}.com`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          role: "NU", // Normal User role
          avatar: "", // No avatar for demo
        };

        // Store user data in localStorage
        localStorage.setItem("3tedutech-user", JSON.stringify(userData));

        // Show success toast
        toast({
          title: "Social login successful",
          description: `Welcome, ${userData.name}!`,
        });

        // Redirect to my courses page after successful login
        navigate("/my-courses");
      } catch (error) {
        console.error("Social login error:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );

        toast({
          variant: "destructive",
          title: "Login failed",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });

        // Redirect to login page after a delay
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [location, navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-background rounded-lg shadow-lg border">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Social Login</h1>
          {isProcessing ? (
            <div className="mt-6 flex flex-col items-center">
              <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                Processing your login...
              </p>
            </div>
          ) : error ? (
            <div className="mt-6 text-center">
              <Icons.alertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="mt-4 text-destructive">{error}</p>
              <p className="mt-2 text-muted-foreground">
                Redirecting you back to login...
              </p>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <Icons.checkCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="mt-4 text-green-500">Login successful!</p>
              <p className="mt-2 text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialLoginCallback;
