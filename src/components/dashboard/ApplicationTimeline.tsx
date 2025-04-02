import { JobApplication } from "@/data/mockJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { startOfMonth, format, isAfter, subMonths } from "date-fns";

interface ApplicationTimelineProps {
  jobs: JobApplication[];
}

const ApplicationTimeline = ({ jobs }: ApplicationTimelineProps) => {
  // Get the data for applications over time (last 6 months)
  const getApplicationTimelineData = () => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5); // Get data for 6 months (current + 5 previous)

    // Create an array of month objects
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(now, 5 - i);
      return {
        month: startOfMonth(date),
        label: format(date, "MMM yy"),
      };
    });

    // Count applications for each month
    const data = months.map(({ month, label }) => {
      const nextMonth = new Date(month);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const totalCount = jobs.filter((job) => {
        if (!job.appliedDate) return false;
        const jobDate = new Date(job.appliedDate);
        return isAfter(jobDate, month) && !isAfter(jobDate, nextMonth);
      }).length;

      const interviewCount = jobs.filter((job) => {
        if (!job.appliedDate) return false;
        const jobDate = new Date(job.appliedDate);
        return (
          isAfter(jobDate, month) &&
          !isAfter(jobDate, nextMonth) &&
          job.status === "interview"
        );
      }).length;

      const offerCount = jobs.filter((job) => {
        if (!job.appliedDate) return false;
        const jobDate = new Date(job.appliedDate);
        return (
          isAfter(jobDate, month) &&
          !isAfter(jobDate, nextMonth) &&
          job.status === "offer"
        );
      }).length;

      return {
        name: label,
        Applications: totalCount,
        Interviews: interviewCount,
        Offers: offerCount,
      };
    });

    return data;
  };

  const data = getApplicationTimelineData();

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl">Application Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {jobs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Applications"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
                <Area
                  type="monotone"
                  dataKey="Interviews"
                  stackId="2"
                  stroke="#60A5FA"
                  fill="#60A5FA"
                />
                <Area
                  type="monotone"
                  dataKey="Offers"
                  stackId="3"
                  stroke="#4ADE80"
                  fill="#4ADE80"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No application data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationTimeline;
