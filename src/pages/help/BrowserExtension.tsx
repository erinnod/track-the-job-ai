import React from "react";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Chrome,
  Download,
  Check,
  AlertCircle,
  Info,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

const BrowserExtensionPage = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-2">JobTrakr Browser Extension</h1>
        <p className="text-gray-600 mb-6">
          Save jobs from LinkedIn and Indeed with a single click
        </p>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Beta Release</AlertTitle>
          <AlertDescription>
            The JobTrakr browser extension is currently in beta. If you
            encounter any issues, please contact our support team.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="usage">How to Use</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>About the Extension</CardTitle>
                  <CardDescription>
                    Simplify your job search with our browser extension
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    The JobTrakr browser extension allows you to save job
                    postings from popular job boards with just one click. No
                    more copying and pasting job details or switching between
                    tabs.
                  </p>

                  <div className="rounded-md bg-slate-50 p-4">
                    <h3 className="text-sm font-medium mb-2">Key Features:</h3>
                    <ul className="text-sm text-slate-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          One-click job saving from LinkedIn and Indeed
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          Automatic extraction of job details (title, company,
                          location)
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Quick access to your JobTrakr dashboard</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>
                          Seamless integration with your JobTrakr account
                        </span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://chrome.google.com/webstore/detail/jobtrakr/extension-id-placeholder",
                        "_blank"
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Extension
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supported Job Boards</CardTitle>
                  <CardDescription>
                    The extension works with these popular job platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src="/images/linkedin-logo.png"
                        alt="LinkedIn"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png";
                        }}
                      />
                      <div>
                        <h3 className="font-medium text-sm">LinkedIn Jobs</h3>
                        <p className="text-sm text-slate-500">
                          Full support for job listings
                        </p>
                      </div>
                      <div className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        Supported
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src="/images/indeed-logo.png"
                        alt="Indeed"
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://upload.wikimedia.org/wikipedia/commons/f/fc/Indeed_logo.png";
                        }}
                      />
                      <div>
                        <h3 className="font-medium text-sm">Indeed</h3>
                        <p className="text-sm text-slate-500">
                          Full support for job listings
                        </p>
                      </div>
                      <div className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        Supported
                      </div>
                    </div>

                    <div className="flex items-center gap-3 opacity-60">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">+</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">
                          More Coming Soon
                        </h3>
                        <p className="text-sm text-slate-500">
                          Additional job boards in development
                        </p>
                      </div>
                      <div className="ml-auto bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">
                        Planned
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="installation">
            <Card>
              <CardHeader>
                <CardTitle>Installation Guide</CardTitle>
                <CardDescription>
                  Follow these steps to install the JobTrakr browser extension
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-md border p-4">
                    <h3 className="text-base font-medium mb-3 flex items-center gap-2">
                      <Chrome className="h-5 w-5 text-blue-600" />
                      Chrome Installation
                    </h3>
                    <ol className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-medium">
                            Visit the Chrome Web Store
                          </p>
                          <p className="text-slate-600 text-sm">
                            Go to the JobTrakr extension page on the Chrome Web
                            Store.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() =>
                              window.open(
                                "https://chrome.google.com/webstore/detail/jobtrakr/extension-id-placeholder",
                                "_blank"
                              )
                            }
                          >
                            Open Chrome Web Store
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-medium">Click "Add to Chrome"</p>
                          <p className="text-slate-600 text-sm">
                            Click the "Add to Chrome" button on the extension
                            page.
                          </p>
                          <div className="mt-2 rounded bg-slate-100 p-2 text-xs text-slate-600">
                            💡 Tip: You may need to confirm the installation in
                            a popup dialog.
                          </div>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <p className="font-medium">
                            Pin the extension (recommended)
                          </p>
                          <p className="text-slate-600 text-sm">
                            Click the extensions icon in your browser toolbar,
                            then click the pin icon next to JobTrakr to keep it
                            visible.
                          </p>
                        </div>
                      </li>

                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                          4
                        </div>
                        <div>
                          <p className="font-medium">
                            Sign in to your JobTrakr account
                          </p>
                          <p className="text-slate-600 text-sm">
                            Click the extension icon and sign in with your
                            JobTrakr credentials.
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      Firefox and Edge versions of the extension are currently
                      in development and will be available soon.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>How to Use the Extension</CardTitle>
                <CardDescription>
                  Learn how to use the JobTrakr extension to save jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-3">
                        Using with LinkedIn
                      </h3>
                      <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            1
                          </div>
                          <div>
                            <p>Navigate to any LinkedIn job posting</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            2
                          </div>
                          <div>
                            <p>
                              Look for the "Save to JobTrakr" button on the job
                              page
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            3
                          </div>
                          <div>
                            <p>Click the button to save the job information</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            4
                          </div>
                          <div>
                            <p>
                              The job will be added to your JobTrakr dashboard
                            </p>
                          </div>
                        </li>
                      </ol>
                      <div className="mt-3 bg-slate-50 p-3 rounded-md">
                        <p className="text-xs text-slate-600">
                          You can also click the extension icon to manually save
                          job details if the button doesn't appear.
                        </p>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="text-base font-medium mb-3">
                        Using with Indeed
                      </h3>
                      <ol className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            1
                          </div>
                          <div>
                            <p>Navigate to any Indeed job posting</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            2
                          </div>
                          <div>
                            <p>
                              Look for the "Save to JobTrakr" button on the job
                              page
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            3
                          </div>
                          <div>
                            <p>Click the button to save the job information</p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            4
                          </div>
                          <div>
                            <p>
                              The job will be added to your JobTrakr dashboard
                            </p>
                          </div>
                        </li>
                      </ol>
                      <div className="mt-3 bg-slate-50 p-3 rounded-md">
                        <p className="text-xs text-slate-600">
                          You can also click the extension icon to manually save
                          job details if the button doesn't appear.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border p-4">
                    <h3 className="text-base font-medium mb-3">
                      Using the Extension Popup
                    </h3>
                    <div className="space-y-4 text-sm">
                      <p>
                        In addition to the save buttons that appear on job
                        pages, you can also use the extension's popup interface:
                      </p>
                      <ol className="space-y-3">
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            1
                          </div>
                          <div>
                            <p>
                              Click the JobTrakr extension icon in your browser
                              toolbar
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            2
                          </div>
                          <div>
                            <p>
                              When viewing a job listing, the extension will
                              automatically detect and display job details
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            3
                          </div>
                          <div>
                            <p>
                              Click "Save to JobTrakr" to save the job
                              information
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                            4
                          </div>
                          <div>
                            <p>
                              You can also click "View Dashboard" to open your
                              JobTrakr dashboard
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions about the JobTrakr browser extension
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">
                      Is the extension free to use?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Yes, the JobTrakr browser extension is completely free to
                      use with your JobTrakr account.
                    </p>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">
                      What information does the extension collect?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      The extension only collects job information from the job
                      listings you explicitly save. It does not track your
                      browsing history or collect any personal information
                      beyond what's needed to save job listings to your account.
                    </p>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">
                      Why doesn't the "Save to JobTrakr" button appear on some
                      job pages?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      The extension is designed to work with standard job
                      listing pages on LinkedIn and Indeed. If the button
                      doesn't appear, the page structure might be different or
                      the site might have updated their layout. You can still
                      save jobs manually by clicking the extension icon and
                      using the popup interface.
                    </p>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">
                      Does the extension work with other job boards?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Currently, the extension officially supports LinkedIn and
                      Indeed. Support for additional job boards is planned for
                      future updates.
                    </p>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-medium">
                      I found a bug or have a feature request. How can I report
                      it?
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      We welcome your feedback! Please contact our support team
                      with any bugs, feature requests, or other feedback about
                      the extension.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        window.open(
                          "mailto:support@jobtrakr.co.uk?subject=Browser Extension Feedback",
                          "_blank"
                        )
                      }
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-slate-500">
                  Have a question that's not answered here? Contact our support
                  team for assistance.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BrowserExtensionPage;
