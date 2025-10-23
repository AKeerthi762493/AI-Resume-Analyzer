import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Linkedin, Twitter, ArrowRight, Sparkles } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Handle subscription
      console.log("Subscribing:", email);
      alert(`Subscribed with: ${email}`);
      setEmail("");
    }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Innomatics AI</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Transforming recruitment with AI-powered resume analysis and intelligent matching for faster, more accurate hiring decisions.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:border-purple-600 hover:bg-purple-50 transition-colors"
              >
                <Github className="w-5 h-5 text-gray-700" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:border-purple-600 hover:bg-purple-50 transition-colors"
              >
                <Linkedin className="w-5 h-5 text-gray-700" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:border-purple-600 hover:bg-purple-50 transition-colors"
              >
                <Twitter className="w-5 h-5 text-gray-700" />
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Resume Analysis
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Job Matching
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Placement Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Skill Gap Analysis
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Batch Processing
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors text-sm">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">✉</span>
                <a href="mailto:contact@innomatics-ai.com" className="hover:text-purple-600 transition-colors">
                  contact@innomatics-ai.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">📞</span>
                <a href="tel:+919876543210" className="hover:text-purple-600 transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">📍</span>
                <span>
                  Hyderabad • Bangalore<br />
                  Pune • Delhi NCR
                </span>
              </li>
            </ul>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                Enterprise Ready
              </span>
              <p className="text-xs text-gray-500 mt-2">
                Trusted by leading placement teams across India
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-gray-200 pt-8 mb-8">
          <div className="max-w-2xl">
            <h3 className="font-semibold text-gray-900 mb-2">Stay Updated</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get the latest updates on AI recruitment trends and platform features.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white px-6"
              >
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>© 2024 Innomatics Research Labs. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Made with</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}