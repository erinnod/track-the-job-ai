import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobApplication } from "@/data/mockJobs";
import { Building, Home, Laptop, Briefcase } from "lucide-react";

interface StatsOverviewProps {
  jobs: JobApplication[];
}

const StatsOverview = ({ jobs }: StatsOverviewProps) => {
  // Calculate work type counts
  const totalCount = jobs.length;
  const remoteCount = jobs.filter((job) => job.workType === "Remote").length;
  const onsiteCount = jobs.filter((job) => job.workType === "On-site").length;
  const hybridCount = jobs.filter((job) => job.workType === "Hybrid").length;
  const notSpecifiedCount = jobs.filter((job) => !job.workType).length;

  const workTypeCards = [
    {
      title: "Total Applications",
      value: totalCount,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Remote Jobs",
      value: remoteCount,
      icon: Home,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "On-site Jobs",
      value: onsiteCount,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Hybrid Jobs",
      value: hybridCount,
      icon: Laptop,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Not Specified",
      value: notSpecifiedCount,
      icon: Building,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {workTypeCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white border border-gray-200 shadow-sm"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </span>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StatsOverview;
