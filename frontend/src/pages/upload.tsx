import { UploadSection } from "@/components/ui/upload-section";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Upload = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <UploadSection />
      
      {/* Navigation Button at Bottom */}
      <div className="py-12 px-6 text-center bg-muted/30">
        <Button 
          onClick={() => navigate('/analytics')}
          className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 hover:from-gray-700 hover:via-white-600 hover:to-black-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
        >
          Smart Analytics & Insights
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default Upload;