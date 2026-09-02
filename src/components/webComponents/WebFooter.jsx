import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube, MessageCircle } from 'lucide-react';
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

  return (
    <footer className="bg-gray-900 text-white mt-auto pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">

          {/* Brand & Description */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              {theme?.webLogo ? (
                <img
                  src={assetUrl(theme.webLogo)}
                  alt={theme.name || 'Logo'}
                  className="h-16 w-auto object-contain bg-white rounded p-1"
                />
              ) : (
                <span className="text-2xl font-bold text-white tracking-wider">
                  {theme?.name || 'PARIVAR'}
                </span>
              )}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Connecting families, celebrating traditions, and building a stronger community together. Stay updated with our latest events and news.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700"
                      aria-label={social.label}
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white uppercase tracking-wider text-sm">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className={`transition-colors text-sm flex items-center group truncate ${
                      link.highlight
                        ? 'text-amber-400 font-bold hover:text-amber-300'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title={link.label}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 transition-colors ${
                      link.highlight ? 'bg-amber-400 animate-pulse' : 'bg-gray-600 group-hover:bg-green-500'
                    }`}></span>
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white uppercase tracking-wider text-sm">Contact Us</h3>
            <ul className="space-y-4">
              {theme?.phone && (
                <li>
                  <a href={`tel:${theme.phone}`} className="flex items-start text-gray-400 hover:text-white transition-colors text-sm group">
                    <Phone size={18} className="mr-3 mt-0.5 text-gray-500 group-hover:text-green-400" />
                    <span>{theme.phone}</span>
                  </a>
                </li>
              )}
              {theme?.email && (
                <li>
                  <a href={`mailto:${theme.email}`} className="flex items-start text-gray-400 hover:text-white transition-colors text-sm group">
                    <Mail size={18} className="mr-3 mt-0.5 text-gray-500 group-hover:text-green-400" />
                    <span>{theme.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Value/Quote */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white uppercase tracking-wider text-sm">Our Values</h3>
            <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-sm italic mb-4">
                "Family is not an important thing, it's everything. We bring community closer through shared values and traditions."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white text-sm">
                  {(theme?.name || 'P')[0]}
                </div>
                <div className="text-sm font-semibold text-gray-300">
                  {theme?.name || 'Parivar'}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {theme?.name || 'Parivar'}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy-policy" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="text-gray-500 hover:text-white transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
