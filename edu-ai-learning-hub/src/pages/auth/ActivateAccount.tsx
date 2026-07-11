/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import { useVerifyEmailMutation } from '@/hooks/queries/auth.queries';

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { mutate, isPending, isSuccess, isError } = useVerifyEmailMutation();

  useEffect(() => {
    if (token) {
      mutate(token);
    }
  }, [token, mutate]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm p-8 text-center">
          {isPending && (
            <>
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Icons.spinner className="h-10 w-10 animate-spin text-brand-500" />
              </div>
              <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Activating Your Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify and activate your account...
              </p>
            </>
          )}

          {isSuccess && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Account Activated!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your account has been successfully activated. You can now log in
                and start learning.
              </p>
              <Button asChild>
                <Link to="/">Log In Now</Link>
              </Button>
            </>
          )}

          {isError && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icons.x className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Activation Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {!token
                  ? 'The activation link is invalid or missing a token.'
                  : "We couldn't activate your account with this link. It may have expired or already been used."}
              </p>
              <div className="space-y-3">
                <Button variant="outline" asChild className="w-full">
                  <a href="mailto:support@3tedutech.com">Contact Support</a>
                </Button>
                <Link to="/">
                  <Button variant="link" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ActivateAccount;
