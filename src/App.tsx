import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Toaster } from '@/components/ui/sonner';
import { SchedulePage } from '@/pages/SchedulePage';
import { StaffPage } from '@/pages/StaffPage';
import { OffRequestPage } from '@/pages/OffRequestPage';
import { HolidayPage } from '@/pages/HolidayPage';
import { GuidePage } from '@/pages/GuidePage';

export default function App() {
  return (
    <BrowserRouter basename="/monthly-schedule">
      <TooltipProvider delay={0}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-x-hidden">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground">근무 스케줄 관리</span>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<GuidePage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/off-requests" element={<OffRequestPage />} />
                <Route path="/holidays" element={<HolidayPage />} />
              </Routes>
            </div>
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
