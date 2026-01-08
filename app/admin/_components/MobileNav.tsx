'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    TrendingUp,
    Package,
    MoreHorizontal,
} from 'lucide-react';

const navItems = [
    { href: '/admin', label: 'Panel', icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: 'Órdenes', icon: ShoppingCart },
    { href: '/admin/sales', label: 'Ventas', icon: TrendingUp },
    { href: '/admin/products', label: 'Productos', icon: Package },
    { href: '/admin/finanzas', label: 'Más', icon: MoreHorizontal },
];

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg lg:hidden">
            <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
                {navItems.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${active
                                    ? 'text-brand'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className={`relative ${active ? 'scale-110' : ''}`}>
                                <item.icon className={`h-6 w-6 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                                {active && (
                                    <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
