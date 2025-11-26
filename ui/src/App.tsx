import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { config } from './lib/wagmi';
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme({
        accentColor: 'hsl(195, 100%, 50%)',
        accentColorForeground: 'hsl(210, 100%, 10%)',
        borderRadius: 'medium',
      })}>
        <InMemoryStorageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </InMemoryStorageProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
