import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube, MessageCircle, ChevronRight, Heart } from 'lucide-react';
import { assetUrl } from '../../lib/api';

const getStoredWebTheme = () => {
  const colorKeys = [
    'backgroundColor', 'borderColor', 'buttonColor', 'fontColor',
    'gradientEnd', 'gradientStart', 'primaryColor', 'secondaryColor', 'textColor',
    'name', 'webLogo', 'favicon', 'phone', 'email', 'facebook', 'instagram', 'twitter', 'youtube', 'whatsapp',
  ];
  const loadedTheme = {};
  colorKeys.forEach((key) => {
    const value = localStorage.getItem(`web_${key}`);
    if (value) loadedTheme[key] = value;
  });
  return loadedTheme;
};

export default function WebFooter() {
  const [theme, setTheme] = useState(getStoredWebTheme);

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme());
    window.addEventListener('storage', loadTheme);
    return () => window.removeEventListener('storage', loadTheme);
  }, []);

  const navigationLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Members', href: '/members' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Events', href: '/events' },
    { label: 'Students', href: '/students' },
    { label: 'Donors', href: '/donors' },
    { label: 'Matrimonial', href: '/matrimonial' },
    { label: 'Job Vacancies', href: '/jobs' },
  ];

  const socialLinks = [
    { icon: Facebook, href: theme?.facebook, label: 'Facebook' },
    { icon: Instagram, href: theme?.instagram, label: 'Instagram' },
    { icon: Twitter, href: theme?.twitter, label: 'Twitter' },
    { icon: Youtube, href: theme?.youtube, label: 'YouTube' },
    { icon: MessageCircle, href: theme?.whatsapp, label: 'WhatsApp' },
  ].filter(link => link.href); // Only show social links that are provided

  const primaryBg = theme?.primaryColor || '#0a2342';

  return (
    <footer
      className="text-white mt-auto pt-16 pb-8 relative overflow-hidden border-t border-white/10"
      style={{ backgroundColor: '#061527' }}
    >
      {/* Decorative Background Accent Glows */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: primaryBg }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">

          {/* Brand & Description */}
          <div className="space-y-5">
            <Link to="/" className="inline-block group">
              {theme?.webLogo ? (
                <div className="p-2 bg-white/95 rounded-xl shadow-lg border border-white/40 transition-transform group-hover:scale-105">
                  <img
                    src={assetUrl(theme.webLogo)}
                    alt={theme.name || 'Logo'}
                    className="h-14 w-auto object-contain"
                  />
                </div>
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-white tracking-wider">
                  {theme?.name || 'PARIVAR'}
                </span>
              )}
            </Link>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xs font-normal">
              Connecting families, celebrating traditions, and building a stronger community together. Stay updated with our latest events and news.
            </p>
            {/* {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-300 hover:text-white transition-all duration-300 p-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/40 hover:-translate-y-1 shadow-sm"
                      aria-label={social.label}
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )} */}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm sm:text-base font-extrabold mb-5 text-white uppercase tracking-wider border-b border-white/10 pb-2.5 inline-block">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-gray-300 hover:text-white transition-all duration-200 text-sm font-semibold flex items-center group truncate"
                    title={link.label}
                  >
                    <ChevronRight size={15} className="mr-1 text-amber-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm sm:text-base font-extrabold mb-5 text-white uppercase tracking-wider border-b border-white/10 pb-2.5 inline-block">
              Contact Us
            </h3>
            <ul className="space-y-4">
              {theme?.phone && (
                <li>
                  <a href={`tel:${theme.phone}`} className="flex items-center text-gray-300 hover:text-white transition-colors text-sm font-semibold group">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mr-3 shrink-0 group-hover:bg-amber-400 group-hover:text-gray-900 transition-colors">
                      <Phone size={16} className="text-gray-300 group-hover:text-gray-900" />
                    </div>
                    <span>{theme.phone}</span>
                  </a>
                </li>
              )}
              {theme?.email && (
                <li>
                  <a href={`mailto:${theme.email}`} className="flex items-center text-gray-300 hover:text-white transition-colors text-sm font-semibold group">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mr-3 shrink-0 group-hover:bg-amber-400 group-hover:text-gray-900 transition-colors">
                      <Mail size={16} className="text-gray-300 group-hover:text-gray-900" />
                    </div>
                    <span className="truncate">{theme.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Our Values */}
          <div>
            <h3 className="text-sm sm:text-base font-extrabold mb-5 text-white uppercase tracking-wider border-b border-white/10 pb-2.5 inline-block">
              Our Commitment
            </h3>
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
              <p className="text-gray-300 text-sm italic mb-4 leading-relaxed font-medium">
                "Bringing families closer, preserving traditions, and fostering community support for generations to come."
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              
                <div className="text-sm font-bold text-gray-200">
                  {theme?.name || 'Parivar Community'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-300 font-medium">
            &copy; {new Date().getFullYear()} {theme?.name || 'Parivar'}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-semibold">
            <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="text-gray-300 hover:text-white transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
