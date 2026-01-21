import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import { CodeEditorPreview } from './CodeEditorPreview';
import { CollaborationSection } from './CollaborationSection';
import { PricingSection } from './PricingSection';
import { Footer } from './Footer';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main>
                <HeroSection />
                <StatsSection />
                <FeaturesSection />
                <CodeEditorPreview />
                <CollaborationSection />
                <PricingSection />
            </main>
            <Footer />
        </div>
    );
}
