import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';

const InstructorRegisterSuccess = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.check className="h-10 w-10 text-green-600 dark:text-green-300" />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Application Submitted!
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Thank you for applying to become an instructor at 3TEduTech.
          </p>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              What happens next?
            </h2>

            <ol className="space-y-4">
              <li className="flex">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mr-3">
                  <span className="font-semibold text-brand-700 dark:text-brand-300">
                    1
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Application Review
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our team will review your application within 2-3 business
                    days. We'll check your experience, qualifications, and
                    ensure you're a good fit for our platform.
                  </p>
                </div>
              </li>

              <li className="flex">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mr-3">
                  <span className="font-semibold text-brand-700 dark:text-brand-300">
                    2
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Email Confirmation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You'll receive an email notification about the status of
                    your application. If approved, the email will contain
                    instructions for the next steps.
                  </p>
                </div>
              </li>

              <li className="flex">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mr-3">
                  <span className="font-semibold text-brand-700 dark:text-brand-300">
                    3
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Set Up Your Profile
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    After approval, you'll be able to complete your instructor
                    profile, set up payment information, and prepare to create
                    your first course.
                  </p>
                </div>
              </li>

              <li className="flex">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mr-3">
                  <span className="font-semibold text-brand-700 dark:text-brand-300">
                    4
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    Start Creating
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Begin creating your first course using our easy-to-use
                    course builder. You'll have access to resources and support
                    to help you succeed.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg border border-yellow-200 dark:border-yellow-700 mb-8 text-left">
            <div className="flex items-start">
              <Icons.info className="h-5 w-5 text-yellow-500 dark:text-yellow-300 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                  While you wait
                </h3>
                <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                  Take some time to explore our instructor resources and start
                  planning your course. This will help you hit the ground
                  running once your application is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/instructor/resources">View Instructor Resources</Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InstructorRegisterSuccess;
