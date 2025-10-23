import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Target, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob top-0 -left-20"></div>
        <div className="absolute w-96 h-96 bg-black-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 top-0 right-20"></div>
        <div className="absolute w-96 h-96 bg-grey-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 bottom-20 left-1/2"></div>
      </div>

      <div className="relative max-w-5xl mx-auto text-center z-10">
        
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight">
          Intelligent Resume
          <br />
          Relevance System
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Transform your hiring process with AI-powered resume analysis. Get instant 
          relevance scores, skill gap analysis, and personalized feedback to match the 
          perfect candidates with the right opportunities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => navigate('/upload')}
            size="lg"
            className="bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 hover:from-gray-700 hover:via-white-600 hover:to-black-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            Start Analyzing Resumes
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-3">
              <Target className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-1">99.5%</div>
            <div className="text-sm text-gray-600">Accuracy Rate</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-3">
              <Zap className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-1">10x</div>
            <div className="text-sm text-gray-600">Faster Processing</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-3">
              <Target className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-gray-600 via-white-600 to-balck-600 bg-clip-text text-transparent leading-tight mb-1">1000+</div>
            <div className="text-sm text-gray-600">Resumes Analyzed</div>
          </div>
        </div>
      </div>
    </section>
  );
}