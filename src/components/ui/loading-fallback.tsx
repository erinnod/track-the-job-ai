import { Loader2 } from "lucide-react";

const LoadingFallback = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <p className="text-slate-600 text-sm animate-pulse">Loading...</p>
    </div>
  );
};

export default LoadingFallback;
