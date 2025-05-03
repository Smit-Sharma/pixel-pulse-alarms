
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateAlarm from "./pages/CreateAlarm";
import EditAlarm from "./pages/EditAlarm";
import NotFound from "./pages/NotFound";
import { AlarmProvider } from "./context/AlarmContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AlarmProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create-alarm" element={<CreateAlarm />} />
            <Route path="/edit-alarm/:id" element={<EditAlarm />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AlarmProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
