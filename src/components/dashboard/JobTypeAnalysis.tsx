import { JobApplication } from "@/data/mockJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  Award,
  Home,
  Building,
  Clock,
  BarChart,
  Laptop,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface JobTypeAnalysisProps {
  jobs: JobApplication[];
}

const JobTypeAnalysis = ({ jobs }: JobTypeAnalysisProps) => {
  // Generate data for job types
  const getTypeData = () => {
    const typeCount = {};
    jobs.forEach((job) => {
      if (job.type) {
        typeCount[job.type] = (typeCount[job.type] || 0) + 1;
      } else {
        typeCount["Not specified"] = (typeCount["Not specified"] || 0) + 1;
      }
    });

    // Create sorted array of objects
    return Object.entries(typeCount)
      .map(([name, count]: [string, number]) => ({
        name,
        count,
        percent: jobs.length ? (count / jobs.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Work type data (on-site/remote/hybrid)
  const getWorkTypeData = () => {
    const workTypeCount = {
      "On-site": 0,
      Remote: 0,
      Hybrid: 0,
      "Not specified": 0,
    };

    jobs.forEach((job) => {
      if (job.workType) {
        workTypeCount[job.workType]++;
      } else {
        workTypeCount["Not specified"]++;
      }
    });

    return Object.entries(workTypeCount)
      .filter(([_, count]) => count > 0)
      .map(([name, count]: [string, number]) => ({
        name,
        count,
        percent: jobs.length ? (count / jobs.length) * 100 : 0,
        icon: getWorkTypeIcon(name),
        color: getWorkTypeColor(name),
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Employment type data (full-time/part-time)
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

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case "Remote":
        return <Home className="h-4 w-4" />;
      case "Hybrid":
        return <Laptop className="h-4 w-4" />;
      case "On-site":
        return <Building className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEmploymentTypeIcon = (type: string) => {
    switch (type) {
      case "Full-time":
        return <Briefcase className="h-4 w-4" />;
      case "Part-time":
        return <Timer className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getWorkTypeColor = (type: string) => {
    switch (type) {
      case "Remote":
        return {
          color: "bg-indigo-400",
          bgColor: "bg-indigo-100",
          textColor: "text-indigo-600",
        };
      case "Hybrid":
        return {
          color: "bg-amber-400",
          bgColor: "bg-amber-100",
          textColor: "text-amber-600",
        };
      case "On-site":
        return {
          color: "bg-blue-400",
          bgColor: "bg-blue-100",
          textColor: "text-blue-600",
        };
      default:
        return {
          color: "bg-gray-400",
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
        };
    }
  };

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case "Full-time":
        return {
          color: "bg-green-400",
          bgColor: "bg-green-100",
          textColor: "text-green-600",
        };
      case "Part-time":
        return {
          color: "bg-purple-400",
          bgColor: "bg-purple-100",
          textColor: "text-purple-600",
        };
      default:
        return {
          color: "bg-gray-400",
          bgColor: "bg-gray-100",
          textColor: "text-gray-600",
        };
    }
  };

  const typeData = getTypeData();
  const workTypeData = getWorkTypeData();
  const employmentTypeData = getEmploymentTypeData();

  // Get appropriate icon for job type
  const getJobTypeIcon = (typeName: string) => {
    if (typeName.toLowerCase().includes("full")) {
      return <Briefcase className="h-4 w-4" />;
    } else if (typeName.toLowerCase().includes("part")) {
      return <Clock className="h-4 w-4" />;
    } else if (typeName.toLowerCase().includes("contract")) {
      return <Award className="h-4 w-4" />;
    } else {
      return <BarChart className="h-4 w-4" />;
    }
  };

  // Generate colors based on item index
  const getItemColor = (index: number) => {
    const colors = [
      {
        color: "bg-blue-400",
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
      },
      {
        color: "bg-purple-400",
        bgColor: "bg-purple-100",
        textColor: "text-purple-600",
      },
      {
        color: "bg-green-400",
        bgColor: "bg-green-100",
        textColor: "text-green-600",
      },
      {
        color: "bg-yellow-400",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-600",
      },
      { color: "bg-red-400", bgColor: "bg-red-100", textColor: "text-red-600" },
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl">Job Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-10">
        {jobs.length > 0 ? (
          <>
            <div>
              <h3 className="font-medium text-gray-700 mb-4">Job Types</h3>
              <div className="space-y-4">
                {typeData.length > 0 ? (
                  typeData.map((item, index) => {
                    const { color, bgColor, textColor } = getItemColor(index);
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-full ${bgColor} ${textColor}`}
                            >
                              {getJobTypeIcon(item.name)}
                            </div>
                            <span className="font-medium text-sm text-gray-700">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {item.count}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({item.percent.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={item.percent} className={color} />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No job type data available
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">No application data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobTypeAnalysis;
