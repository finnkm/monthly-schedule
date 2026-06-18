import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, CalendarOff, Star, LayoutGrid, BookOpen, HardDrive, MessageCircle } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const navItems = [
  { to: '/', label: '사용 가이드', icon: BookOpen },
  { to: '/schedule', label: '스케줄', icon: Calendar },
  { to: '/staff', label: '직원 관리', icon: Users },
  { to: '/off-requests', label: 'OFF 신청', icon: CalendarOff },
  { to: '/holidays', label: '공휴일 관리', icon: Star },
  { to: '/data', label: '데이터 관리', icon: HardDrive },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 cursor-pointer rounded-lg hover:bg-sidebar-accent transition-colors"
          onClick={() => navigate('/')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0 leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">근무 스케줄 관리</span>
            <span className="text-[10px] text-muted-foreground">Schedule Manager</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ to, label, icon: Icon }) => {
                const isActive =
                  to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(to);
                return (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={label}
                      render={<NavLink to={to} end={to === '/'} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={location.pathname === '/feedback'}
              tooltip="개발자 노트"
              render={<NavLink to="/feedback" />}
            >
              <MessageCircle />
              <span>개발자 노트</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
