import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";

interface HeroSectionProps {
  onNewTransfer: () => void;
  onViewHistory: () => void;
}

const HeroSection = ({ onNewTransfer, onViewHistory }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground">
      <div className="absolute inset-0 opacity-20">
        <img 
          src={heroImage} 
          alt="Construction materials tracking" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Build Trust with Every Transfer
          </h2>
          <p className="text-lg md:text-xl mb-8 text-primary-foreground/90">
            Record encrypted material handovers on the blockchain. Prevent disputes over quantity or responsibility with immutable, verified transfer logs.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={onNewTransfer}
              size="lg"
              variant="secondary"
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              New Transfer
            </Button>
            <Button 
              onClick={onViewHistory}
              size="lg"
              variant="outline"
              className="gap-2 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <FileText className="h-5 w-5" />
              View History
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
