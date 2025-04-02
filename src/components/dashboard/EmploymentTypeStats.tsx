import { JobApplication } from "@/data/mockJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface EmploymentTypeStatsProps {
  jobs: JobApplication[];
}

const EmploymentTypeStats = ({ jobs }: EmploymentTypeStatsProps) => {
  // Calculate employment type data
  const getEmploymentTypeData = () => {
    const employmentTypeCount = {
      "Full-time": 0,
      "Part-time": 0,
      "Not specified": 0,
    };

    jobs.forEach((job) => {
      if (job.employmentType) {
        employmentTypeCount[job.employmentType]++;
      } else {
        employmentTypeCount["Not specified"]++;
      }
    });

    return Object.entries(employmentTypeCount)
      .filter(([_, count]) => count > 0)
      .map(([name, count]: [string, number]) => ({
        name,
        count,
        percent: jobs.length ? (count / jobs.length) * 100 : 0,
        icon: getEmploymentTypeIcon(name),
        color: getEmploymentTypeColor(name),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getEmploymentTypeIcon = (type: string) => {
    switch (type) {
      case "Full-time":
        return <Briefcase className="h-4 w-4" />;
      case "Part-time":
        return <Timer className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case "Full-time":
        return {
          color: "bg-green-400",
          bgColor: "bg-green-100",
          textColor: "text-green-600",
          badgeColor: "border-green-200 bg-green-100 text-green-700",
        };
      case "Part-time":
        return {
          color: "bg-purple-400",
          bgColor: "bg-purple-100",
          textColor: "text-purple-600",
          badgeColor: "border-purple-200 bg-purple-100 text-purple-700",
        };
      default:
        return {
          color: "bg-gray-400",
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
          badgeColor: "border-gray-200 bg-gray-100 text-gray-700",
        };
    }
  };

  const employmentTypeData = getEmploymentTypeData();

  return (
    <Card className="col-span-1 md:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl">Employment Type</CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {employmentTypeData.map((item) => (
              <Card key={item.name} className="border shadow-sm bg-white">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div
                    className={`rounded-full ${item.color.bgColor} p-2 mb-2`}
                  >
                    <div className={item.color.textColor}>{item.icon}</div>
                  </div>
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-2xl font-bold mt-1">{item.count}</div>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${item.color.badgeColor}`}
                  >
                    {item.percent.toFixed(0)}%
                  </Badge>
                  <div className="w-full mt-3">
                    <Progress
                      value={item.percent}
                      className={item.color.color}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-gray-500">No employment type data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmploymentTypeStats;
