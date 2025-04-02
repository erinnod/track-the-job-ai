
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { JobApplication, getStatusCount } from "@/data/mockJobs";
import { Briefcase, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface StatsOverviewProps {
  jobs: JobApplication[];
}

const StatsOverview = ({ jobs }: StatsOverviewProps) => {
  const stats = getStatusCount(jobs);
  
  const statCards = [
    {
      title: "Total Applications",
      value: stats.total,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Applications",
      value: stats.applied + stats.interview,
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Offers Received",
      value: stats.offer,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Saved Jobs",
      value: stats.saved,
      icon: Clock,
      color: "text-gray-600",
      bgColor: "bg-gray-50"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
