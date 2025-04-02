
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface JobSearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  className?: string;
}

const JobSearchBar = ({ searchTerm, setSearchTerm, className }: JobSearchBarProps) => {
  return (
    <div className={cn("relative flex-1", className)}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search jobs..."
        className="pl-9 bg-white border-gray-200"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default JobSearchBar;
