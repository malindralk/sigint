'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ChevronRight, BookOpen, Brain, GraduationCap } from 'lucide-react';

const vizNav = [
  { href: '/graph', label: 'Knowledge Graph', icon: '◎', color: '#39d353' },
  { href: '/market', label: 'Market Intel', icon: '▲', color: '#58a6ff' },
  { href: '/companies', label: 'Companies', icon: '◈', color: '#bc8cff' },
  { href: '/equipment', label: 'Equipment', icon: '⊡', color: '#f0883e' },
  { href: '/research', label: 'Research', icon: '◷', color: '#e3b341' },
];

const wikiGroups = [
  {
    id: 'em-sca',
    label: 'EM Side-Channel',
    icon: ChevronRight,
    color: '#39d353',
    items: [
      { slug: 'electromagnetic-side-channel-analysis', label: 'Overview & Theory' },
      { slug: 'tempest-standards-reference', label: 'TEMPEST Standards' },
      { slug: 'pqc-em-sca', label: 'Post-Quantum Crypto' },
      { slug: 'electromagnetic-side-channel-practical-guide', label: 'Practical Guide' },
      { slug: 'entry-level-em-sca-setup', label: 'Entry-Level Setup' },
      { slug: 'research-grade-em-sca-lab', label: 'Research-Grade Lab' },
      { slug: 'professional-em-sca-facility', label: 'Professional Facility' },
      { slug: 'em-sca-market-analysis-overview', label: 'Market Analysis' },
      { slug: 'em-sca-key-players-companies', label: 'Key Players' },
      { slug: 'em-sca-consumer-applications', label: 'Consumer Applications' },
      { slug: 'em-sca-index', label: 'Index & Cross-Refs' },
      { slug: 'em-sca-2026-developments', label: '2026 Developments' },
      { slug: 'sdr-tools-landscape-2026', label: 'SDR Tools' },
      { slug: 'pqc-implementation-security-2026', label: 'PQC Implementation' },
      { slug: 'contacts', label: 'Contacts' },
      { slug: 'organizations', label: 'Organizations' },
    ],
  },
  {
    id: 'sigint',
    label: 'SIGINT',
    icon: ChevronRight,
    color: '#58a6ff',
    items: [
      { slug: 'sigint-academic-research-overview', label: 'Academic Research' },
      { slug: 'sigint-private-companies-em-intelligence', label: 'Private Companies' },
      { slug: 'rf-fingerprinting-device-identification', label: 'RF Fingerprinting' },
      { slug: 'sigint-machine-learning-pipeline', label: 'ML Pipeline' },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      className="border-r border-border-default"
      style={{
        '--sidebar-width': '15rem',
        '--sidebar-width-mobile': '16rem',
      } as React.CSSProperties}
    >
      <SidebarHeader className="border-b border-border-default px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent-green font-mono font-bold tracking-tight text-sm">SIGINT</span>
          <span className="text-text-secondary font-mono text-xs">WIKI</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Visualizations */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-mono text-text-muted uppercase tracking-widest">
            Visualize
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vizNav.map((item) => {
                const active = pathname === item.href || pathname === `${item.href}/`;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.href}>
                        <span className="font-mono text-base" style={{ color: active ? item.color : undefined }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Learning — with submenu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-mono text-text-muted uppercase tracking-widest">
            Articles
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Learning — expandable with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/learning')}>
                  <Link href="/learning">
                    <BookOpen className="h-4 w-4" />
                    <span>Learning Path</span>
                  </Link>
                </SidebarMenuButton>
                {/* Submenu: Coursera Path */}
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={pathname === '/learning/coursera-sigint/' || pathname === '/learning/coursera-sigint'}
                    >
                      <Link href="/learning/coursera-sigint">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span>Coursera Path</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>

              {/* EM-SCA & SIGINT groups */}
              {wikiGroups.map((group) => {
                const groupActive = pathname.startsWith(`/${group.id}`);
                const Icon = group.icon;
                return (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton asChild isActive={groupActive}>
                      <Link href={`/${group.id}`}>
                        <Icon className="h-4 w-4" />
                        <span>{group.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const href = `/${group.id}/${item.slug}`;
                        const active = pathname === href || pathname === `${href}/`;
                        return (
                          <SidebarMenuSubItem key={item.slug}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={active}
                            >
                              <Link href={href}>{item.label}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border-default px-4 py-2">
        <p className="text-text-muted text-xs font-mono">Apr 2026</p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
