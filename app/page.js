'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { supabase, DEFAULT_ORG_ID } from '../lib/supabase';

// =====================================================
// CONFIGURATION
// =====================================================

const DIRECTORY_CONFIG = {
  name: "Ourgorithm", 
  tagline: "SEO Audit Tool",
  colors: {
    primary: '#2d3748',
    secondary: '#3b82f6',
    accent: '#10b981',
  },
  logoUrl: '/images/OGlogo.jpeg',
};

const getScoreColor = (score) => {
  if (score >= 80) return { bg: '#059669', text: '#ffffff', label: 'Excellent', class: 'bg-emerald-600' };
  if (score >= 60) return { bg: '#84cc16', text: '#1a1a1a', label: 'Good', class: 'bg-lime-500' };
  if (score >= 40) return { bg: '#eab308', text: '#1a1a1a', label: 'Needs Work', class: 'bg-yellow-500' };
  if (score >= 20) return { bg: '#f97316', text: '#ffffff', label: 'Poor', class: 'bg-orange-500' };
  return { bg: '#dc2626', text: '#ffffff', label: 'Critical', class: 'bg-red-600' };
};

// =====================================================
// PLAIN-ENGLISH EXPLANATIONS FOR CLIENTS
// =====================================================

const CHECK_EXPLANATIONS = {
  // Technical SEO
  https_enabled: {
    name: "Secure Connection (HTTPS)",
    whatItMeans: "Your website has a security certificate. Visitors see a padlock icon and browsers trust your site.",
    whyItMatters: "Without HTTPS, browsers show 'Not Secure' warnings. Visitors leave immediately, and Google ranks you lower.",
    fixTime: "1-2 hours",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks to see ranking impact",
  },
  canonical_tags: {
    name: "Canonical Tags",
    whatItMeans: "Your site tells Google which version of a page is the 'official' one.",
    whyItMatters: "Without this, Google might see duplicate pages and split your ranking power between them.",
    fixTime: "1 hour",
    fixDifficulty: "Easy",
    googleTimeline: "2-4 weeks",
  },
  indexable: {
    name: "Page is Indexable",
    whatItMeans: "Google is ALLOWED to add this page to search results.",
    whyItMatters: "If blocked, your page literally cannot appear in Google searches. Invisible to customers.",
    fixTime: "30 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks",
  },
  json_ld_present: {
    name: "Structured Data (Schema)",
    whatItMeans: "Your site speaks Google's language. It tells Google your business name, address, phone, hours, etc.",
    whyItMatters: "With schema, Google can show rich results: star ratings, business hours, click-to-call. Without it, you're just plain text.",
    fixTime: "2-3 hours",
    fixDifficulty: "Medium",
    googleTimeline: "2-4 weeks for rich results to appear",
  },
  local_business_schema: {
    name: "Local Business Schema",
    whatItMeans: "Google knows you're a local business with a physical location.",
    whyItMatters: "Critical for appearing in local searches and Google Maps. Without it, Google doesn't know WHERE you are.",
    fixTime: "1-2 hours",
    fixDifficulty: "Medium",
    googleTimeline: "2-4 weeks",
  },
  
  // On-Page SEO
  title_present: {
    name: "Title Tag",
    whatItMeans: "Your page has a headline that appears in Google search results and browser tabs.",
    whyItMatters: "This is the #1 thing people see in Google. No title = Google makes one up (usually badly).",
    fixTime: "30 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks",
  },
  title_length: {
    name: "Title Length",
    whatItMeans: "Your title is the right length (50-60 characters) to display fully in Google.",
    whyItMatters: "Too long gets cut off with '...' — Too short wastes valuable keyword space.",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks",
  },
  meta_description: {
    name: "Meta Description",
    whatItMeans: "The 2-line summary that appears under your title in Google search results.",
    whyItMatters: "This is your sales pitch in Google. No description = Google picks random text from your page.",
    fixTime: "30 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks",
  },
  h1_present: {
    name: "H1 Headline",
    whatItMeans: "Your page has a main headline that tells visitors (and Google) what the page is about.",
    whyItMatters: "Google uses the H1 to understand your page topic. No H1 = confused Google = worse rankings.",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks",
  },
  image_alt: {
    name: "Image Alt Text",
    whatItMeans: "Your images have descriptions that Google can read (since Google can't 'see' images).",
    whyItMatters: "Helps with Google Image search, accessibility for blind users, and overall SEO.",
    fixTime: "1-2 hours",
    fixDifficulty: "Easy",
    googleTimeline: "2-4 weeks",
  },
  
  // Local Presence
  phone_visible: {
    name: "Phone Number Visible",
    whatItMeans: "Visitors can easily find your phone number on the website.",
    whyItMatters: "If they can't find your number in 3 seconds, they call your competitor instead.",
    fixTime: "30 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "Immediate for visitors",
  },
  contact_page: {
    name: "Contact Page",
    whatItMeans: "You have a dedicated page where customers can reach you.",
    whyItMatters: "Standard expectation. Missing = looks unprofessional or abandoned.",
    fixTime: "1-2 hours",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks for indexing",
  },
  about_page: {
    name: "About Page",
    whatItMeans: "A page that tells your story, shows your team, builds trust.",
    whyItMatters: "People buy from people. No About page = faceless business = less trust.",
    fixTime: "2-3 hours",
    fixDifficulty: "Easy",
    googleTimeline: "1-2 weeks for indexing",
  },
  services_page: {
    name: "Services Page",
    whatItMeans: "A clear page listing what you offer.",
    whyItMatters: "Customers need to know what you do. Also helps rank for service-related searches.",
    fixTime: "2-4 hours",
    fixDifficulty: "Medium",
    googleTimeline: "2-4 weeks",
  },
  
  // Trust Signals
  privacy_policy: {
    name: "Privacy Policy",
    whatItMeans: "A legal page explaining how you handle customer data.",
    whyItMatters: "Required by law in most places. Missing = legal risk + looks unprofessional.",
    fixTime: "1 hour",
    fixDifficulty: "Easy (use template)",
    googleTimeline: "Not ranking-related",
  },
  terms: {
    name: "Terms of Service",
    whatItMeans: "Legal terms for using your website/services.",
    whyItMatters: "Protects your business legally. Expected by savvy customers.",
    fixTime: "1 hour",
    fixDifficulty: "Easy (use template)",
    googleTimeline: "Not ranking-related",
  },
  testimonials: {
    name: "Testimonials / Reviews",
    whatItMeans: "Real customer feedback displayed on your site.",
    whyItMatters: "THE #1 trust factor for local businesses. No reviews = 'Are they any good?'",
    fixTime: "2-4 hours",
    fixDifficulty: "Medium",
    googleTimeline: "Immediate for conversions",
  },
  portfolio: {
    name: "Portfolio / Work Examples",
    whatItMeans: "Photos or case studies of your actual work.",
    whyItMatters: "Proof you do what you say. Especially important for contractors, designers, etc.",
    fixTime: "3-5 hours",
    fixDifficulty: "Medium",
    googleTimeline: "2-4 weeks for image indexing",
  },
  
  // Social
  facebook: {
    name: "Facebook Link",
    whatItMeans: "Your website links to your Facebook business page.",
    whyItMatters: "Social proof + another way for customers to find and contact you.",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "Not ranking-related",
  },
  instagram: {
    name: "Instagram Link",
    whatItMeans: "Your website links to your Instagram profile.",
    whyItMatters: "Important for visual businesses (restaurants, salons, contractors).",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "Not ranking-related",
  },
  linkedin: {
    name: "LinkedIn Link",
    whatItMeans: "Your website links to your LinkedIn profile.",
    whyItMatters: "Professional credibility, especially for B2B services.",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "Not ranking-related",
  },
  youtube: {
    name: "YouTube Link",
    whatItMeans: "Your website links to your YouTube channel.",
    whyItMatters: "Video builds trust. If you have videos, show them off.",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "Not ranking-related",
  },
  twitter: {
    name: "Twitter/X Link",
    whatItMeans: "Your website links to your Twitter profile.",
    whyItMatters: "Less important for local businesses, but adds legitimacy.",
    fixTime: "15 minutes",
    fixDifficulty: "Easy",
    googleTimeline: "Not ranking-related",
  },
};

// Directory Readiness Requirements
const DIRECTORY_REQUIREMENTS = {
  featured: {
    label: "Featured Ready",
    minScore: 75,
    requirements: [
      { key: 'https', label: 'HTTPS enabled', checkFn: (audit) => audit?.url?.startsWith('https') },
      { key: 'phone', label: 'Phone visible on site', checkFn: (audit) => audit?.checks?.phone_visible?.passed },
      { key: 'contact', label: 'Contact page exists', checkFn: (audit) => audit?.checks?.contact_page?.passed },
      { key: 'schema', label: 'Structured data (Schema)', checkFn: (audit) => audit?.checks?.json_ld_present?.passed },
      { key: 'title', label: 'Proper title tags', checkFn: (audit) => audit?.checks?.title_present?.passed },
      { key: 'description', label: 'Meta description', checkFn: (audit) => audit?.checks?.meta_description?.passed },
      { key: 'testimonials', label: 'Testimonials shown', checkFn: (audit) => audit?.checks?.testimonials?.passed },
      { key: 'privacy', label: 'Privacy policy', checkFn: (audit) => audit?.checks?.privacy_policy?.passed },
    ],
  },
  basic: {
    label: "Basic Ready",
    minScore: 50,
    requirements: [
      { key: 'https', label: 'HTTPS enabled', checkFn: (audit) => audit?.url?.startsWith('https') },
      { key: 'phone', label: 'Phone visible on site', checkFn: (audit) => audit?.checks?.phone_visible?.passed },
      { key: 'contact', label: 'Contact page exists', checkFn: (audit) => audit?.checks?.contact_page?.passed },
      { key: 'title', label: 'Proper title tags', checkFn: (audit) => audit?.checks?.title_present?.passed },
    ],
  },
};

// Industry presets
const INDUSTRY_PRESETS = {
  home_services: { label: 'Home Services', avgValue: 650, closeRate: 0.30 },
  general_contractor: { label: 'Contractor', avgValue: 3500, closeRate: 0.20 },
  dental: { label: 'Dental', avgValue: 900, closeRate: 0.25 },
  restaurant: { label: 'Restaurant', avgValue: 35, closeRate: 0.60 },
  attorney: { label: 'Attorney', avgValue: 2500, closeRate: 0.15 },
  med_spa: { label: 'Med Spa', avgValue: 600, closeRate: 0.20 },
  real_estate: { label: 'Real Estate', avgValue: 4000, closeRate: 0.10 },
  salon: { label: 'Salon', avgValue: 120, closeRate: 0.35 },
  auto_repair: { label: 'Auto Repair', avgValue: 450, closeRate: 0.25 },
  funeral_services: { label: 'Funeral Services', avgValue: 8000, closeRate: 0.40 },
  other: { label: 'Other', avgValue: 500, closeRate: 0.20 },
};

// =====================================================
// CRAWLER WITH MULTIPLE PROXY FALLBACKS
// =====================================================

// List of CORS proxies to try (in order)
const CORS_PROXIES = [
  {
    name: 'corsproxy.io',
    buildUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    parseResponse: async (response) => {
      const text = await response.text();
      return text;
    },
  },
  {
    name: 'allorigins',
    buildUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    parseResponse: async (response) => {
      const text = await response.text();
      return text;
    },
  },
  {
    name: 'corsproxy.org',
    buildUrl: (url) => `https://corsproxy.org/?${encodeURIComponent(url)}`,
    parseResponse: async (response) => {
      const text = await response.text();
      return text;
    },
  },
  {
    name: 'cors-anywhere-alt',
    buildUrl: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    parseResponse: async (response) => {
      const text = await response.text();
      return text;
    },
  },
];

async function fetchWithProxy(url) {
  let lastError = 'All proxies failed';
  
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy.buildUrl(url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const response = await fetch(proxyUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        lastError = `${proxy.name}: HTTP ${response.status}`;
        continue;
      }
      
      const html = await proxy.parseResponse(response);
      
      if (html && html.length > 500 && html.includes('<')) {
        console.log(`✓ Success with ${proxy.name} for ${url}`);
        return { success: true, html, url, proxy: proxy.name };
      } else {
        lastError = `${proxy.name}: Invalid or empty response`;
        continue;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        lastError = `${proxy.name}: Timeout`;
      } else {
        lastError = `${proxy.name}: ${error.message}`;
      }
      continue;
    }
  }
  
  console.log(`✗ All proxies failed for ${url}: ${lastError}`);
  return { success: false, error: lastError };
}

// Try multiple URL variations
async function fetchWithRetries(domain) {
  const urlVariations = [
    `https://${domain}`,
    `https://www.${domain}`,
    `http://${domain}`,
    `http://www.${domain}`,
  ];
  
  // Remove duplicates if domain already has www
  const cleanDomain = domain.replace(/^www\./, '');
  const uniqueUrls = [...new Set([
    `https://${cleanDomain}`,
    `https://www.${cleanDomain}`,
    `http://${cleanDomain}`,
    `http://www.${cleanDomain}`,
  ])];
  
  for (const url of uniqueUrls) {
    console.log(`Trying: ${url}`);
    const result = await fetchWithProxy(url);
    if (result.success) {
      return result;
    }
  }
  
  return { 
    success: false, 
    error: `Could not reach ${domain} after trying all URL variations and proxies. The site may have bot protection or be temporarily unavailable.`,
    noPresence: false,
    unreachable: true,
  };
}

function detectPlatform(html) {
  const h = html.toLowerCase();
  
  // WordPress - multiple detection patterns
  if (h.includes('wp-content') || h.includes('wp-includes') || h.includes('wp-json') || 
      h.includes('wordpress') || h.includes('/wp-') || h.includes('woocommerce')) {
    return { name: 'WordPress', confidence: 95, canFix: 'full', note: 'Full control — we can fix everything' };
  }
  
  // Wix
  if (h.includes('wix.com') || h.includes('_wix_') || h.includes('wixsite.com') || 
      h.includes('static.wixstatic.com') || h.includes('wix-code')) {
    return { name: 'Wix', confidence: 95, canFix: 'partial', note: 'Some limitations — can optimize within constraints' };
  }
  
  // Squarespace
  if (h.includes('squarespace') || h.includes('sqsp.net') || h.includes('static1.squarespace') ||
      h.includes('squarespace-cdn')) {
    return { name: 'Squarespace', confidence: 95, canFix: 'partial', note: 'Most fixes possible with some workarounds' };
  }
  
  // Shopify
  if (h.includes('shopify') || h.includes('cdn.shopify') || h.includes('myshopify.com') ||
      h.includes('shopifycdn')) {
    return { name: 'Shopify', confidence: 95, canFix: 'partial', note: 'E-commerce focused — good SEO tools available' };
  }
  
  // Webflow
  if (h.includes('webflow') || h.includes('website-files.com') || h.includes('webflow.io') ||
      h.includes('w-nav') || h.includes('w-slider')) {
    return { name: 'Webflow', confidence: 95, canFix: 'full', note: 'Good control — clean implementation possible' };
  }
  
  // GoDaddy
  if (h.includes('godaddy') || h.includes('secureserver.net') || h.includes('godaddysites') ||
      h.includes('mywebsite.godaddy') || h.includes('ondigitalocean.app')) {
    return { name: 'GoDaddy', confidence: 85, canFix: 'partial', note: 'Basic builder — some limitations' };
  }
  
  // Weebly
  if (h.includes('weebly') || h.includes('weeblycloud') || h.includes('editmysite')) {
    return { name: 'Weebly', confidence: 95, canFix: 'partial', note: 'Simple builder — basic SEO available' };
  }
  
  // Duda
  if (h.includes('duda') || h.includes('dudaone.com') || h.includes('duda.co')) {
    return { name: 'Duda', confidence: 95, canFix: 'full', note: 'Agency-friendly — good capabilities' };
  }
  
  // HubSpot
  if (h.includes('hubspot') || h.includes('hs-scripts.com') || h.includes('hs-analytics') ||
      h.includes('hubspotusercontent') || h.includes('hscollectedforms')) {
    return { name: 'HubSpot', confidence: 88, canFix: 'full', note: 'Marketing platform — excellent tools' };
  }
  
  // ClickFunnels
  if (h.includes('clickfunnels') || h.includes('cfimg.com') || h.includes('cffastcdn')) {
    return { name: 'ClickFunnels', confidence: 95, canFix: 'limited', note: 'Funnel builder — not built for SEO' };
  }
  
  // Drupal
  if (h.includes('drupal') || h.includes('/sites/default/files') || h.includes('drupal.js') ||
      h.includes('/sites/all/')) {
    return { name: 'Drupal', confidence: 90, canFix: 'full', note: 'Powerful CMS — full control available' };
  }
  
  // Joomla
  if (h.includes('joomla') || h.includes('/media/jui/') || h.includes('/components/com_')) {
    return { name: 'Joomla', confidence: 90, canFix: 'full', note: 'Established CMS — full control available' };
  }
  
  // Ghost
  if (h.includes('ghost.io') || h.includes('ghost-url') || h.includes('"ghost"')) {
    return { name: 'Ghost', confidence: 90, canFix: 'full', note: 'Modern blogging platform — clean code' };
  }
  
  // Kajabi
  if (h.includes('kajabi') || h.includes('kajabi-cdn')) {
    return { name: 'Kajabi', confidence: 95, canFix: 'limited', note: 'Course platform — limited SEO options' };
  }
  
  // BigCommerce
  if (h.includes('bigcommerce') || h.includes('bigcommerce.com')) {
    return { name: 'BigCommerce', confidence: 95, canFix: 'partial', note: 'E-commerce platform — solid SEO basics' };
  }
  
  // Framer
  if (h.includes('framer') || h.includes('framerusercontent') || h.includes('framer.com')) {
    return { name: 'Framer', confidence: 95, canFix: 'partial', note: 'Design-focused — some SEO limitations' };
  }
  
  // Bubble
  if (h.includes('bubble.io') || h.includes('bblcdn.com')) {
    return { name: 'Bubble', confidence: 95, canFix: 'limited', note: 'No-code app builder — SEO limitations' };
  }
  
  // Carrd
  if (h.includes('carrd.co') || h.includes('crd.co')) {
    return { name: 'Carrd', confidence: 95, canFix: 'limited', note: 'Simple one-page builder — very basic SEO' };
  }
  
  // Jimdo
  if (h.includes('jimdo') || h.includes('jimdocdn')) {
    return { name: 'Jimdo', confidence: 95, canFix: 'partial', note: 'Simple builder — basic SEO available' };
  }
  
  // Leadpages
  if (h.includes('leadpages') || h.includes('lpages.co')) {
    return { name: 'Leadpages', confidence: 95, canFix: 'limited', note: 'Landing page builder — limited SEO' };
  }
  
  // Format/Adobe Portfolio
  if (h.includes('format.com') || h.includes('myportfolio.com') || h.includes('adobe portfolio')) {
    return { name: 'Adobe Portfolio', confidence: 90, canFix: 'limited', note: 'Portfolio builder — basic SEO only' };
  }
  
  // Blogger
  if (h.includes('blogger.com') || h.includes('blogspot.com') || h.includes('blogblog.com')) {
    return { name: 'Blogger', confidence: 95, canFix: 'partial', note: 'Google blog platform — basic SEO' };
  }
  
  // Cargo
  if (h.includes('cargo.site') || h.includes('cargocollective')) {
    return { name: 'Cargo', confidence: 95, canFix: 'limited', note: 'Portfolio platform — limited SEO' };
  }
  
  // 10Web (AI builder)
  if (h.includes('10web.io') || h.includes('starter.starter')) {
    return { name: '10Web', confidence: 90, canFix: 'full', note: 'WordPress-based AI builder — full control' };
  }
  
  // Elementor (WordPress page builder)
  if (h.includes('elementor') || h.includes('elementor-kit')) {
    return { name: 'WordPress + Elementor', confidence: 95, canFix: 'full', note: 'WordPress page builder — full control' };
  }
  
  // Divi (WordPress theme/builder)
  if (h.includes('divi') || h.includes('et-builder') || h.includes('elegantthemes')) {
    return { name: 'WordPress + Divi', confidence: 95, canFix: 'full', note: 'WordPress page builder — full control' };
  }
  
  // Next.js / React
  if (h.includes('_next/static') || h.includes('__next') || h.includes('next/head')) {
    return { name: 'Next.js (React)', confidence: 85, canFix: 'full', note: 'Modern framework — full control with developer' };
  }
  
  // Gatsby
  if (h.includes('gatsby') || h.includes('___gatsby')) {
    return { name: 'Gatsby', confidence: 90, canFix: 'full', note: 'Static site generator — fast & SEO-friendly' };
  }
  
  // Hugo
  if (h.includes('hugo-') || h.includes('powered by hugo')) {
    return { name: 'Hugo', confidence: 85, canFix: 'full', note: 'Static site generator — fast & lightweight' };
  }
  
  // Bootstrap indicators (custom built)
  if ((h.includes('bootstrap') || h.includes('btn btn-')) && !h.includes('wp-')) {
    return { name: 'Custom (Bootstrap)', confidence: 70, canFix: 'full', note: 'Custom built — likely full control' };
  }
  
  // jQuery-heavy custom sites
  if (h.includes('jquery') && h.includes('custom') || (h.match(/jquery/g) || []).length > 2) {
    return { name: 'Custom Built', confidence: 60, canFix: 'full', note: 'Custom built — needs developer for changes' };
  }
  
  // Check for common hosting-specific patterns that suggest custom
  if (h.includes('netlify') || h.includes('vercel') || h.includes('cloudflare pages') ||
      h.includes('github.io') || h.includes('gitlab.io')) {
    return { name: 'Custom/Static', confidence: 70, canFix: 'full', note: 'Likely custom or static site — full control' };
  }
  
  // Last resort - try to detect if it's at least a CMS
  if (h.includes('cms') || h.includes('content-management')) {
    return { name: 'Unknown CMS', confidence: 40, canFix: 'unknown', note: 'Uses a CMS but cannot identify which one' };
  }
  
  return { name: 'Custom/Unknown', confidence: 30, canFix: 'unknown', note: 'Could not detect platform — may be custom built or behind protection' };
}

function runAuditChecks(html, url) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const title = doc.querySelector('title')?.textContent?.trim() || '';
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const h1s = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim()).filter(Boolean);
  const hasCanonical = !!doc.querySelector('link[rel="canonical"]');
  const robotsMeta = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
  const isIndexable = !robotsMeta.includes('noindex');
  
  const images = Array.from(doc.querySelectorAll('img'));
  const imagesWithoutAlt = images.filter(img => !img.getAttribute('alt')).length;
  
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const hasJsonLd = jsonLdScripts.length > 0;
  let hasLocalBusiness = false;
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      if (data['@type']?.includes('LocalBusiness') || data['@type']?.includes('Organization')) {
        hasLocalBusiness = true;
      }
    } catch {}
  });
  
  const bodyText = doc.body?.textContent || '';
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const phones = [...new Set(bodyText.match(phoneRegex) || [])];
  
  const links = Array.from(doc.querySelectorAll('a'));
  const linkTexts = links.map(a => ({ text: a.textContent?.toLowerCase() || '', href: a.getAttribute('href') || '' }));
  
  const hasContact = linkTexts.some(l => l.text.includes('contact') || l.href.includes('contact'));
  const hasAbout = linkTexts.some(l => l.text.includes('about') || l.href.includes('about'));
  const hasServices = linkTexts.some(l => l.text.includes('service') || l.href.includes('service'));
  const hasPrivacy = linkTexts.some(l => l.text.includes('privacy') || l.href.includes('privacy'));
  const hasTerms = linkTexts.some(l => l.text.includes('terms') || l.href.includes('terms'));
  const hasTestimonials = linkTexts.some(l => l.text.includes('testimonial') || l.text.includes('review') || l.href.includes('testimonial'));
  const hasPortfolio = linkTexts.some(l => l.text.includes('portfolio') || l.text.includes('gallery') || l.text.includes('work'));
  
  // Smarter social media detection - only count actual profile links
  const socialLinks = {
    facebook: null,
    instagram: null,
    linkedin: null,
    youtube: null,
    twitter: null,
  };
  
  links.forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    
    // Facebook - must be a profile, not a share button or homepage
    if (href.includes('facebook.com/') && 
        !href.includes('facebook.com/sharer') && 
        !href.includes('facebook.com/share') &&
        !href.includes('facebook.com/dialog') &&
        !href.includes('facebook.com/plugins') &&
        href !== 'https://facebook.com/' &&
        href !== 'https://www.facebook.com/' &&
        href !== 'http://facebook.com/' &&
        href !== 'http://www.facebook.com/') {
      // Check if it has a path after facebook.com/
      const fbMatch = href.match(/facebook\.com\/([a-zA-Z0-9._-]+)/);
      if (fbMatch && fbMatch[1] && !['sharer', 'share', 'dialog', 'plugins', 'sharer.php'].includes(fbMatch[1])) {
        socialLinks.facebook = href;
      }
    }
    
    // Instagram - must be a profile
    if (href.includes('instagram.com/') &&
        href !== 'https://instagram.com/' &&
        href !== 'https://www.instagram.com/' &&
        href !== 'http://instagram.com/' &&
        href !== 'http://www.instagram.com/') {
      const igMatch = href.match(/instagram\.com\/([a-zA-Z0-9._-]+)/);
      if (igMatch && igMatch[1] && !['p', 'explore', 'accounts', 'about'].includes(igMatch[1])) {
        socialLinks.instagram = href;
      }
    }
    
    // LinkedIn - must be a company or personal page
    if (href.includes('linkedin.com/') &&
        (href.includes('/company/') || href.includes('/in/')) &&
        href !== 'https://linkedin.com/' &&
        href !== 'https://www.linkedin.com/') {
      socialLinks.linkedin = href;
    }
    
    // YouTube - must be a channel or user page
    if (href.includes('youtube.com/') &&
        (href.includes('/channel/') || href.includes('/c/') || href.includes('/user/') || href.includes('/@')) &&
        !href.includes('/watch') &&
        href !== 'https://youtube.com/' &&
        href !== 'https://www.youtube.com/') {
      socialLinks.youtube = href;
    }
    
    // Twitter/X - must be a profile
    if ((href.includes('twitter.com/') || href.includes('x.com/')) &&
        !href.includes('/intent/') &&
        !href.includes('/share') &&
        href !== 'https://twitter.com/' &&
        href !== 'https://www.twitter.com/' &&
        href !== 'https://x.com/' &&
        href !== 'https://www.x.com/') {
      const twMatch = href.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/);
      if (twMatch && twMatch[1] && !['intent', 'share', 'home', 'search'].includes(twMatch[1])) {
        socialLinks.twitter = href;
      }
    }
  });
  
  const hasFacebook = !!socialLinks.facebook;
  const hasInstagram = !!socialLinks.instagram;
  const hasLinkedIn = !!socialLinks.linkedin;
  const hasYouTube = !!socialLinks.youtube;
  const hasTwitter = !!socialLinks.twitter;
  
  const isHttps = url.startsWith('https://');
  
  // Build checks object
  const checks = {
    // Technical
    https_enabled: { passed: isHttps, category: 'technical', points: isHttps ? 8 : 0, maxPoints: 8 },
    canonical_tags: { passed: hasCanonical, category: 'technical', points: hasCanonical ? 5 : 0, maxPoints: 5 },
    indexable: { passed: isIndexable, category: 'technical', points: isIndexable ? 6 : 0, maxPoints: 6 },
    json_ld_present: { passed: hasJsonLd, category: 'technical', points: hasJsonLd ? 6 : 0, maxPoints: 6 },
    
    // On-Page
    title_present: { passed: !!title, category: 'onpage', points: title ? 7 : 0, maxPoints: 7, value: title },
    title_length: { passed: title.length >= 30 && title.length <= 60, category: 'onpage', points: (title.length >= 30 && title.length <= 60) ? 3 : 1, maxPoints: 3, value: `${title.length} chars` },
    meta_description: { passed: !!metaDesc, category: 'onpage', points: metaDesc ? 5 : 0, maxPoints: 5, value: metaDesc?.substring(0, 50) + '...' },
    h1_present: { passed: h1s.length > 0, category: 'onpage', points: h1s.length > 0 ? 6 : 0, maxPoints: 6, value: h1s[0] },
    image_alt: { passed: imagesWithoutAlt === 0, category: 'onpage', points: imagesWithoutAlt === 0 ? 4 : (imagesWithoutAlt < 3 ? 2 : 0), maxPoints: 4, value: `${images.length - imagesWithoutAlt}/${images.length}` },
    
    // Local
    phone_visible: { passed: phones.length > 0, category: 'local', points: phones.length > 0 ? 8 : 0, maxPoints: 8, value: phones[0] },
    contact_page: { passed: hasContact, category: 'local', points: hasContact ? 7 : 0, maxPoints: 7 },
    about_page: { passed: hasAbout, category: 'local', points: hasAbout ? 5 : 0, maxPoints: 5 },
    services_page: { passed: hasServices, category: 'local', points: hasServices ? 5 : 0, maxPoints: 5 },
    
    // Trust
    privacy_policy: { passed: hasPrivacy, category: 'trust', points: hasPrivacy ? 4 : 0, maxPoints: 4 },
    terms: { passed: hasTerms, category: 'trust', points: hasTerms ? 3 : 0, maxPoints: 3 },
    testimonials: { passed: hasTestimonials, category: 'trust', points: hasTestimonials ? 5 : 0, maxPoints: 5 },
    portfolio: { passed: hasPortfolio, category: 'trust', points: hasPortfolio ? 3 : 0, maxPoints: 3 },
    
    // Social
    facebook: { passed: hasFacebook, category: 'social', points: hasFacebook ? 2 : 0, maxPoints: 2, value: socialLinks.facebook || 'Not found' },
    instagram: { passed: hasInstagram, category: 'social', points: hasInstagram ? 2 : 0, maxPoints: 2, value: socialLinks.instagram || 'Not found' },
    linkedin: { passed: hasLinkedIn, category: 'social', points: hasLinkedIn ? 2 : 0, maxPoints: 2, value: socialLinks.linkedin || 'Not found' },
    youtube: { passed: hasYouTube, category: 'social', points: hasYouTube ? 2 : 0, maxPoints: 2, value: socialLinks.youtube || 'Not found' },
    twitter: { passed: hasTwitter, category: 'social', points: hasTwitter ? 2 : 0, maxPoints: 2, value: socialLinks.twitter || 'Not found' },
  };
  
  // Calculate category scores
  const categories = {
    technical: { name: 'Technical SEO', score: 0, maxScore: 25, checks: [] },
    onpage: { name: 'On-Page SEO', score: 0, maxScore: 25, checks: [] },
    local: { name: 'Local Presence', score: 0, maxScore: 25, checks: [] },
    trust: { name: 'Trust Signals', score: 0, maxScore: 15, checks: [] },
    social: { name: 'Social Presence', score: 0, maxScore: 10, checks: [] },
  };
  
  Object.entries(checks).forEach(([key, check]) => {
    categories[check.category].score += check.points;
    categories[check.category].checks.push({ key, ...check, ...CHECK_EXPLANATIONS[key] });
  });
  
  const totalScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0);
  
  return { checks, categories, totalScore, maxScore: 100 };
}

async function runFullAudit(domain) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').trim();
  
  // Try to fetch the site with multiple proxies and URL variations
  const result = await fetchWithRetries(cleanDomain);
  
  if (!result.success) {
    if (result.unreachable) {
      return { 
        success: false, 
        error: result.error, 
        noPresence: false,
        unreachable: true,
        domain: cleanDomain,
      };
    }
    return { 
      success: false, 
      error: `Could not reach ${domain}. The site may be down or blocking our scan.`, 
      noPresence: true,
      domain: cleanDomain,
    };
  }
  
  const url = result.url;
  const platform = detectPlatform(result.html);
  const auditResults = runAuditChecks(result.html, url);
  
  // Calculate directory readiness
  const featuredReqs = DIRECTORY_REQUIREMENTS.featured.requirements;
  const passedFeatured = featuredReqs.filter(req => req.checkFn({ url, checks: auditResults.checks })).length;
  const featuredPercentage = Math.round((passedFeatured / featuredReqs.length) * 100);
  
  const basicReqs = DIRECTORY_REQUIREMENTS.basic.requirements;
  const passedBasic = basicReqs.filter(req => req.checkFn({ url, checks: auditResults.checks })).length;
  
  let readinessTier = 'not_ready';
  if (auditResults.totalScore >= DIRECTORY_REQUIREMENTS.featured.minScore && passedFeatured === featuredReqs.length) {
    readinessTier = 'featured';
  } else if (auditResults.totalScore >= DIRECTORY_REQUIREMENTS.basic.minScore && passedBasic === basicReqs.length) {
    readinessTier = 'basic';
  }
  
  return {
    success: true,
    domain: cleanDomain,
    url,
    auditDate: new Date().toISOString(),
    platform,
    proxyUsed: result.proxy,
    ...auditResults,
    directoryReadiness: {
      tier: readinessTier,
      percentage: featuredPercentage,
      passedCount: passedFeatured,
      totalCount: featuredReqs.length,
      requirements: featuredReqs.map(req => ({
        ...req,
        passed: req.checkFn({ url, checks: auditResults.checks }),
      })),
    },
  };
}

// =====================================================
// SUPABASE DATABASE FUNCTIONS
// =====================================================

async function loadSitesFromDB() {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', DEFAULT_ORG_ID)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load sites:', err);
    return [];
  }
}

async function saveSiteToDB(site) {
  try {
    const { data, error } = await supabase
      .from('sites')
      .insert({
        organization_id: DEFAULT_ORG_ID,
        domain: site.domain,
        url: `https://${site.domain}`,
        business_name: site.businessName || null,
        address: site.address || null,
        city: site.city || null,
        state: site.state || null,
        zip: site.zip || null,
        phone: site.phone || null,
        industry: site.industry || 'other',
        stage: site.stage || 'lead',
        notes: site.notes || '',
        data_confidence_source: 'detected',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to save site:', err);
    return null;
  }
}

async function updateSiteInDB(siteId, updates) {
  try {
    const { data, error } = await supabase
      .from('sites')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to update site:', err);
    return null;
  }
}

async function deleteSiteFromDB(siteId) {
  try {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete site:', err);
    return false;
  }
}

async function saveAuditToDB(siteId, audit) {
  try {
    const { data, error } = await supabase
      .from('audits')
      .insert({
        site_id: siteId,
        total_score: audit.totalScore,
        technical_score: audit.categories?.technical?.score,
        onpage_score: audit.categories?.onpage?.score,
        local_presence_score: audit.categories?.local?.score,
        trust_score: audit.categories?.trust?.score,
        social_score: audit.categories?.social?.score,
        platform_detected: audit.platform?.name,
        platform_confidence: audit.platform?.confidence / 100,
        directory_readiness: audit.directoryReadiness?.tier,
        directory_blockers: audit.directoryReadiness?.requirements?.filter(r => !r.passed).map(r => r.label),
        categories: audit.categories,
        quick_wins: audit.quickWins || [],
        top_issues: audit.topIssues || [],
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update site with latest audit info
    await supabase
      .from('sites')
      .update({
        latest_score: audit.totalScore,
        latest_audit_id: data.id,
        latest_audit_at: new Date().toISOString(),
        platform_detected: audit.platform?.name,
        platform_confidence: audit.platform?.confidence / 100,
        directory_readiness: audit.directoryReadiness?.tier,
      })
      .eq('id', siteId);
    
    return data;
  } catch (err) {
    console.error('Failed to save audit:', err);
    return null;
  }
}

async function loadFullAuditFromDB(siteId) {
  try {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    
    // Convert DB format back to app format
    return {
      success: true,
      totalScore: data.total_score,
      platform: { 
        name: data.platform_detected || 'Unknown', 
        confidence: (data.platform_confidence || 0.5) * 100,
        note: ''
      },
      directoryReadiness: { 
        tier: data.directory_readiness || 'not_ready', 
        percentage: data.directory_readiness === 'featured' ? 100 : data.directory_readiness === 'basic' ? 75 : 25,
        passedCount: data.directory_readiness === 'featured' ? 8 : data.directory_readiness === 'basic' ? 6 : 2,
        totalCount: 8,
        requirements: (data.directory_blockers || []).map(b => ({ label: b, passed: false }))
      },
      categories: data.categories || null,
      auditDate: data.created_at,
    };
  } catch (err) {
    console.error('Failed to load audit:', err);
    return null;
  }
}

async function saveSprintRequestToDB(siteId, email, phone, readinessTier, blockers, siteDomain) {
  try {
    const { data, error } = await supabase
      .from('sprint_requests')
      .insert({
        site_id: siteId,
        organization_id: DEFAULT_ORG_ID,
        email,
        phone,
        readiness_tier: readinessTier,
        blockers,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Send email notification (opens user's email client)
    const subject = encodeURIComponent(`New Sprint Request: ${siteDomain}`);
    const body = encodeURIComponent(`
New Sprint Request Received!

Website: ${siteDomain}
Client Email: ${email}
Client Phone: ${phone}
Readiness Tier: ${readinessTier}
Blockers: ${blockers.join(', ') || 'None'}

---
Sent from Ourgorithm SEO Tool
    `.trim());
    
    // Open email client with pre-filled info
    window.open(`mailto:info@theservicejunkies.com?subject=${subject}&body=${body}`, '_blank');
    
    return data;
  } catch (err) {
    console.error('Failed to save sprint request:', err);
    return null;
  }
}

// =====================================================
// PDF REPORT GENERATOR
// =====================================================

function generateReportHTML(site, audit, branding = {}) {
  const { companyName = DIRECTORY_CONFIG.name, primaryColor = DIRECTORY_CONFIG.colors.primary, logoUrl = '' } = branding;
  const scoreColor = getScoreColor(audit.totalScore || 0);
  const auditDate = audit.auditDate ? new Date(audit.auditDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let categoryRows = '';
  if (audit.categories) {
    categoryRows = Object.entries(audit.categories).map(([key, cat]) => {
      const catColor = getScoreColor((cat.score / cat.maxScore) * 100);
      return `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 16px; color: #1f2937;">${cat.name}</h3>
            <span style="background: ${catColor.bg}; color: ${catColor.text}; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">
              ${cat.score}/${cat.maxScore}
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; width: 30px;"></th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb;">Check</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb;">What This Means</th>
                <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb;">Fix Time</th>
              </tr>
            </thead>
            <tbody>
              ${cat.checks.map(check => `
                <tr style="background: ${check.passed ? '#f0fdf4' : '#fef2f2'};">
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 16px;">
                    ${check.passed ? '✓' : '✗'}
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: ${check.passed ? '#166534' : '#991b1b'};">
                    ${check.name || check.key}
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                    ${check.whatItMeans || '—'}
                  </td>
                  <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
                    ${check.passed ? '—' : (check.fixTime || '—')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  } else {
    categoryRows = `
      <div style="padding: 24px; background: #fef3c7; border-radius: 12px; text-align: center;">
        <p style="color: #92400e; margin: 0;">Detailed breakdown not available. Run a new audit for full details.</p>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ourgorithm SEO Audit - ${site.domain}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #1f2937; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${primaryColor}, #0f172a); color: white; padding: 32px; margin: -40px -40px 32px; border-radius: 0 0 16px 16px;">
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Ourgorithm</div>
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 4px;">SEO Audit Report</div>
      <h1 style="font-size: 28px; margin-bottom: 8px;">${site.businessName || site.domain}</h1>
      <div style="opacity: 0.8;">${site.domain} • ${auditDate} • ${audit.platform?.name || 'Unknown Platform'}</div>
    </div>

    <!-- Business Info -->
    ${site.address || site.phone ? `
    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">📍 Business Information</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
        ${site.address ? `<div><span style="color: #6b7280;">Address:</span> ${site.address}</div>` : ''}
        ${site.phone ? `<div><span style="color: #6b7280;">Phone:</span> ${site.phone}</div>` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Score Summary -->
    <div style="display: flex; gap: 24px; margin-bottom: 32px;">
      <div style="flex: 1; background: #f8fafc; border-radius: 16px; padding: 24px; text-align: center;">
        <div style="width: 100px; height: 100px; border-radius: 50%; background: ${scoreColor.bg}; color: ${scoreColor.text}; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; margin: 0 auto 12px;">
          ${audit.totalScore || 0}
        </div>
        <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${scoreColor.label}</div>
        <div style="color: #6b7280; font-size: 12px;">Ourgorithm Score</div>
      </div>
      
      <div style="flex: 1; background: ${audit.directoryReadiness?.tier === 'featured' ? '#ecfdf5' : audit.directoryReadiness?.tier === 'basic' ? '#eff6ff' : '#fff7ed'}; border-radius: 16px; padding: 24px;">
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">Directory Readiness</div>
        <div style="font-size: 32px; font-weight: bold; color: ${audit.directoryReadiness?.tier === 'featured' ? '#059669' : audit.directoryReadiness?.tier === 'basic' ? '#2563eb' : '#ea580c'};">
          ${audit.directoryReadiness?.percentage || 0}%
        </div>
        <div style="margin-top: 8px; padding: 6px 12px; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 12px; background: ${audit.directoryReadiness?.tier === 'featured' ? '#059669' : audit.directoryReadiness?.tier === 'basic' ? '#2563eb' : '#ea580c'}; color: white;">
          ${audit.directoryReadiness?.tier === 'featured' ? '⭐ Featured Ready' : audit.directoryReadiness?.tier === 'basic' ? '✓ Basic Ready' : '✗ Not Ready'}
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
          ${audit.directoryReadiness?.passedCount || 0} of ${audit.directoryReadiness?.totalCount || 8} requirements met
        </div>
      </div>
    </div>

    <!-- Platform -->
    <div style="background: #eef2ff; border-radius: 12px; padding: 16px; margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
      <span style="font-size: 24px;">💻</span>
      <div style="flex: 1;">
        <div style="font-weight: 600; color: #3730a3;">Built with ${audit.platform?.name || 'Unknown'}</div>
        <div style="font-size: 12px; color: #6366f1;">${audit.platform?.note || ''}</div>
      </div>
    </div>

    <!-- Category Details -->
    ${categoryRows}

    <!-- Directory Requirements -->
    ${(audit.directoryReadiness?.requirements && audit.directoryReadiness.requirements.length > 0) ? `
    <div style="margin-top: 32px; padding: 24px; background: #f8fafc; border-radius: 16px;">
      <h3 style="margin-bottom: 16px; font-size: 16px;">📋 Directory Requirements Checklist</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${audit.directoryReadiness.requirements.map(req => `
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 8px; background: ${req.passed ? '#f0fdf4' : '#fef2f2'};">
            <span style="font-size: 16px;">${req.passed ? '✓' : '✗'}</span>
            <span style="color: ${req.passed ? '#166534' : '#991b1b'};">${req.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px;">
      <p>Generated by Ourgorithm SEO Audit Tool</p>
      <p style="margin-top: 4px;">This report provides an assessment based on automated analysis. Results should be verified manually.</p>
    </div>
  </div>
</body>
</html>`;
}

async function downloadPDF(site, audit, branding = {}) {
  try {
    // Check if we have audit data
    let fullAudit = audit;
    if (!audit) {
      alert('No audit data available. Please run an audit first.');
      return;
    }
    
    console.log('Starting PDF generation for:', site.domain);
    console.log('Initial audit data:', JSON.stringify(audit, null, 2));
    
    // If audit is missing categories, try to load full audit from database
    if (!audit.categories && site.id) {
      console.log('Loading full audit from database for site ID:', site.id);
      const dbAudit = await loadFullAuditFromDB(site.id);
      if (dbAudit) {
        fullAudit = dbAudit;
        console.log('Full audit loaded from DB:', JSON.stringify(dbAudit, null, 2));
      } else {
        console.log('No audit found in database');
      }
    }
    
    // Generate HTML with fallbacks for missing data
    const safeAudit = {
      totalScore: fullAudit.totalScore || 0,
      platform: fullAudit.platform || { name: 'Unknown', note: '', confidence: 0 },
      directoryReadiness: fullAudit.directoryReadiness || { tier: 'not_ready', percentage: 0, passedCount: 0, totalCount: 8, requirements: [] },
      categories: fullAudit.categories || null,
      auditDate: fullAudit.auditDate || new Date().toISOString(),
    };
    
    console.log('Safe audit data:', JSON.stringify(safeAudit, null, 2));
    
    const html = generateReportHTML(site, safeAudit, branding);
    console.log('Generated HTML length:', html.length);
    
    if (html.length < 500) {
      console.error('HTML too short, something went wrong');
      alert('Error generating report. Please try running a new audit.');
      return;
    }
    
    // Method 1: Try opening in new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Give it time to render
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      // Method 2: Fallback - download as HTML file
      console.log('Popup blocked, using download fallback');
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ourgorithm-report-${site.domain}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Report downloaded as HTML. Open it in your browser and use Print > Save as PDF.');
    }
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF: ' + error.message + '\n\nCheck the browser console for details.');
  }
}

// =====================================================
// NO PRESENCE LETTER COMPONENT
// =====================================================

const NoPresenceLetter = ({ domain, onClose }) => {
  const letterContent = `
ONLINE PRESENCE ASSESSMENT

Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Website: ${domain}

Dear Business Owner,

We attempted to analyze your website (${domain}) to assess your online presence and identify opportunities for growth. Unfortunately, we were unable to access or retrieve meaningful data from your website.

This typically indicates one or more of the following:

1. YOUR WEBSITE MAY BE DOWN OR INACCESSIBLE
   • The site is not loading for visitors
   • This means potential customers CANNOT find or contact you online

2. YOUR WEBSITE MAY BE BLOCKING AUTOMATED TOOLS
   • While this can be intentional, it also blocks search engines like Google
   • If Google can't access your site, you won't appear in search results

3. THE DOMAIN MAY NOT HAVE A WEBSITE YET
   • The domain exists but no website has been built
   • You're invisible to the ~90% of customers who search online first

WHAT THIS MEANS FOR YOUR BUSINESS:

• You are likely INVISIBLE in local Google searches
• Customers searching for your services find your competitors instead
• You're missing potential leads every single day
• Your business lacks the credibility that comes with an online presence

RECOMMENDED IMMEDIATE ACTIONS:

1. Verify your website is accessible by visiting ${domain} in a browser
2. Check with your hosting provider if there are any issues
3. If you don't have a website, this should be your TOP priority

OUR RECOMMENDATION:

A professional online presence is no longer optional—it's essential. We recommend scheduling a consultation to discuss building or fixing your online presence.

We're here to help when you're ready.

Sincerely,
${DIRECTORY_CONFIG.name} Team
  `.trim();

  const downloadLetter = () => {
    const blob = new Blob([letterContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `no-presence-assessment-${domain}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b bg-red-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-red-800">⚠️ Online Presence Not Detected</h2>
              <p className="text-red-600 text-sm mt-1">{domain}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>
        
        <div className="p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
            {letterContent}
          </pre>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={downloadLetter}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            📥 Download Letter
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(letterContent)}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100"
          >
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MAIN APP COMPONENT
// =====================================================

export default function OnlinePresenceAuditTool() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIndustry, setNewIndustry] = useState('other');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState({});
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [error, setError] = useState(null);
  const [showNoPresenceLetter, setShowNoPresenceLetter] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showSprintModal, setShowSprintModal] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branding, setBranding] = useState({
    companyName: DIRECTORY_CONFIG.name,
    primaryColor: DIRECTORY_CONFIG.colors.primary,
    logoUrl: DIRECTORY_CONFIG.logoUrl,
  });

  // Set page title
  useEffect(() => {
    document.title = 'Ourgorithm - SEO Audit Tool';
  }, []);

  // Load sites from Supabase on mount
  useEffect(() => {
    async function loadSites() {
      setIsLoadingSites(true);
      try {
        const dbSites = await loadSitesFromDB();
        // Convert DB format to app format
        const formattedSites = dbSites.map(s => ({
          id: s.id,
          domain: s.domain,
          businessName: s.business_name || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || '',
          zip: s.zip || '',
          phone: s.phone || '',
          industry: s.industry || 'other',
          stage: s.stage || 'lead',
          notes: s.notes || '',
          followUpDate: s.follow_up_date,
          createdAt: s.created_at,
          dataConfidenceSource: s.data_confidence_source || 'detected',
          audit: s.latest_score ? {
            success: true,
            totalScore: s.latest_score,
            platform: { name: s.platform_detected, confidence: (s.platform_confidence || 0.5) * 100 },
            directoryReadiness: { tier: s.directory_readiness, percentage: 0 },
            auditDate: s.latest_audit_at,
          } : null,
        }));
        setSites(formattedSites);
      } catch (err) {
        console.error('Failed to load sites:', err);
        setError('Failed to load sites from database');
      } finally {
        setIsLoadingSites(false);
      }
    }
    loadSites();
  }, []);

  // Add a new site
  const addSite = useCallback(async () => {
    if (!newDomain.trim()) {
      setError('Please enter a website domain');
      return;
    }
    const domain = newDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').trim();
    if (sites.some(s => s.domain === domain)) {
      setError('Site already added');
      return;
    }
    
    // Parse address into components if possible
    const addressParts = newAddress.split(',').map(p => p.trim());
    const city = addressParts[1] || '';
    const stateZip = addressParts[2] || '';
    const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/i);
    const state = stateMatch ? stateMatch[1].toUpperCase() : '';
    const zip = stateMatch ? stateMatch[2] || '' : '';
    
    // Save to database
    const dbSite = await saveSiteToDB({ 
      domain, 
      businessName: newBusinessName,
      address: newAddress,
      city,
      state,
      zip,
      phone: newPhone,
      industry: newIndustry, 
      stage: 'lead', 
      notes: '' 
    });
    
    if (dbSite) {
      const newSite = {
        id: dbSite.id,
        domain,
        businessName: newBusinessName,
        address: newAddress,
        city,
        state,
        zip,
        phone: newPhone,
        industry: newIndustry,
        stage: 'lead',
        notes: '',
        dataConfidenceSource: 'detected',
        audit: null,
        createdAt: dbSite.created_at,
      };
      setSites(prev => [newSite, ...prev]);
    } else {
      // Fallback to local-only if DB fails
      const newSite = {
        id: Date.now(),
        domain,
        businessName: newBusinessName,
        address: newAddress,
        city,
        state,
        zip,
        phone: newPhone,
        industry: newIndustry,
        stage: 'lead',
        notes: '',
        dataConfidenceSource: 'detected',
        audit: null,
        createdAt: new Date().toISOString(),
      };
      setSites(prev => [newSite, ...prev]);
    }
    
    // Reset form
    setNewDomain('');
    setNewBusinessName('');
    setNewAddress('');
    setNewPhone('');
    setNewIndustry('other');
    setShowAddForm(false);
    setError(null);
  }, [newDomain, newBusinessName, newAddress, newPhone, newIndustry, sites]);

  // Run audit
  const runAudit = useCallback(async (siteId) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    
    setIsLoading(prev => ({ ...prev, [siteId]: true }));
    setError(null);
    
    try {
      const audit = await runFullAudit(site.domain);
      
      if (!audit.success) {
        if (audit.noPresence) {
          setShowNoPresenceLetter(site.domain);
          setSites(prev => prev.map(s => s.id === siteId ? { ...s, audit: { noPresence: true, error: audit.error } } : s));
        } else if (audit.unreachable) {
          setError(`Could not scan ${site.domain}. This is usually due to:\n• Cloudflare or bot protection\n• Server blocking automated requests\n• Temporary network issues\n\nTry again in a few minutes, or the site may need manual review.`);
          setSites(prev => prev.map(s => s.id === siteId ? { ...s, audit: { unreachable: true, error: audit.error } } : s));
        } else {
          setError(audit.error || 'Unknown error occurred');
        }
      } else {
        // Save audit to database
        await saveAuditToDB(siteId, audit);
        
        setSites(prev => prev.map(s => s.id === siteId ? { ...s, audit } : s));
        setSelectedSite({ ...site, audit });
        setCurrentView('site-detail');
      }
    } catch (err) {
      setError(`Audit failed: ${err.message}`);
    } finally {
      setIsLoading(prev => ({ ...prev, [siteId]: false }));
    }
  }, [sites]);

  // Delete site
  const deleteSite = useCallback(async (siteId) => {
    await deleteSiteFromDB(siteId);
    setSites(prev => prev.filter(s => s.id !== siteId));
    if (selectedSite?.id === siteId) {
      setSelectedSite(null);
      setCurrentView('dashboard');
    }
  }, [selectedSite]);

  // Update site
  const updateSite = useCallback(async (siteId, updates) => {
    // Update in database
    await updateSiteInDB(siteId, {
      industry: updates.industry,
      stage: updates.stage,
      notes: updates.notes,
      follow_up_date: updates.followUpDate,
    });
    
    setSites(prev => prev.map(s => s.id === siteId ? { ...s, ...updates } : s));
    if (selectedSite?.id === siteId) {
      setSelectedSite(prev => ({ ...prev, ...updates }));
    }
  }, [selectedSite]);

  // Stats
  const totalSites = sites.length;
  const auditedSites = sites.filter(s => s.audit?.success || s.audit?.totalScore).length;
  const avgScore = auditedSites > 0 
    ? Math.round(sites.filter(s => s.audit?.success || s.audit?.totalScore).reduce((sum, s) => sum + (s.audit.totalScore || 0), 0) / auditedSites)
    : 0;
  const featuredReady = sites.filter(s => s.audit?.directoryReadiness?.tier === 'featured').length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg px-2 py-1">
            <span className="font-bold text-slate-800 text-lg">OG</span>
          </div>
          <span className="font-semibold">Ourgorithm</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900 text-white p-6">
          <div className="flex justify-between items-center mb-8">
            <span className="font-semibold text-lg">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-2xl">✕</button>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: '📊', label: 'Dashboard' },
              { id: 'sites', icon: '🌐', label: 'Sites' },
              { id: 'settings', icon: '⚙️', label: 'Settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setCurrentView(item.id); setSelectedSite(null); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-4 rounded-lg flex items-center gap-3 text-lg ${
                  currentView === item.id ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="bg-white rounded-lg px-3 py-2 mb-3 inline-block">
            <span className="font-bold text-slate-800 text-xl">Ourgorithm</span>
          </div>
          <p className="text-slate-400 text-sm">SEO Audit Tool</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => { setCurrentView('dashboard'); setSelectedSite(null); }}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  currentView === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <span>📊</span> Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => { setCurrentView('sites'); setSelectedSite(null); }}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  currentView === 'sites' ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <span>🌐</span> Sites
                {totalSites > 0 && (
                  <span className="ml-auto bg-slate-700 px-2 py-0.5 rounded text-xs">{totalSites}</span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => setCurrentView('settings')}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                  currentView === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'
                }`}
              >
                <span>⚙️</span> Settings
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">Powered by {branding.companyName}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-4 flex justify-between items-start">
            <div className="whitespace-pre-line">{error}</div>
            <button onClick={() => setError(null)} className="font-bold ml-4">×</button>
          </div>
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="p-4 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Ourgorithm Dashboard</h2>
            
            {/* Loading State */}
            {isLoadingSites && (
              <div className="text-center py-16 bg-white rounded-xl mb-6">
                <div className="text-4xl mb-4 animate-pulse">🔄</div>
                <p className="text-gray-500">Loading sites from database...</p>
              </div>
            )}
            
            {!isLoadingSites && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-3xl font-bold text-gray-800">{totalSites}</div>
                    <div className="text-gray-500 text-sm">Total Sites</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-3xl font-bold text-gray-800">{auditedSites}</div>
                    <div className="text-gray-500 text-sm">Audited</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600">{avgScore}</div>
                    <div className="text-gray-500 text-sm">Avg Score</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-3xl font-bold text-emerald-600">{featuredReady}</div>
                    <div className="text-gray-500 text-sm">Featured Ready</div>
                  </div>
                </div>

                {/* Add Site */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Add New Business</h3>
                    {!showAddForm && (
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                      >
                        + Add Business
                      </button>
                    )}
                  </div>
                  
                  {showAddForm && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website Domain *</label>
                          <input
                            type="text"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            placeholder="mybusiness.com"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                          <input
                            type="text"
                            value={newBusinessName}
                            onChange={(e) => setNewBusinessName(e.target.value)}
                            placeholder="My Business LLC"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                          <input
                            type="text"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            placeholder="123 Main St, Bronx, NY 10451"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="(718) 555-1234"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                          <select
                            value={newIndustry}
                            onChange={(e) => setNewIndustry(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                          >
                            {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => (
                              <option key={key} value={key}>{preset.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end gap-3">
                          <button 
                            onClick={addSite}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                          >
                            + Add Business
                          </button>
                          <button 
                            onClick={() => {
                              setShowAddForm(false);
                              setNewDomain('');
                              setNewBusinessName('');
                              setNewAddress('');
                              setNewPhone('');
                              setNewIndustry('other');
                            }}
                            className="px-4 py-3 border-2 border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        💡 Tip: Enter the address to show the business on a map. Data marked as "Detected" until verified.
                      </p>
                    </div>
                  )}
                  
                  {!showAddForm && (
                    <p className="text-sm text-gray-500">Click "Add Business" to add a new site for auditing</p>
                  )}
                </div>

                {/* Recent Sites */}
                {sites.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 md:p-6 border-b">
                      <h3 className="font-semibold text-gray-800">Recent Sites</h3>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Site</th>
                          <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Score</th>
                          <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Platform</th>
                          <th className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Status</th>
                          <th className="text-right px-4 md:px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sites.slice(0, 5).map(site => (
                          <tr key={site.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-800">{site.businessName || site.domain}</div>
                              {site.businessName && <div className="text-xs text-gray-500">{site.domain}</div>}
                              {site.address && <div className="text-xs text-gray-400 mt-0.5">📍 {site.address}</div>}
                            </td>
                            <td className="px-6 py-4">
                              {(site.audit?.success || site.audit?.totalScore) ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold text-white ${getScoreColor(site.audit.totalScore).class}`}>
                                  {site.audit.totalScore}
                                </span>
                              ) : site.audit?.noPresence ? (
                                <span className="text-red-500 text-sm">No Presence</span>
                              ) : site.audit?.unreachable ? (
                                <span className="text-orange-500 text-sm">⚠️ Protected</span>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {site.audit?.platform ? (
                                <span className="text-sm text-gray-600">{site.audit.platform.name}</span>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {site.audit?.directoryReadiness ? (
                                <span className={`text-sm font-medium ${
                                  site.audit.directoryReadiness.tier === 'featured' ? 'text-emerald-600' :
                                  site.audit.directoryReadiness.tier === 'basic' ? 'text-blue-600' :
                                  'text-orange-600'
                                }`}>
                                  {site.audit.directoryReadiness.tier === 'featured' ? '⭐ Featured' :
                                   site.audit.directoryReadiness.tier === 'basic' ? '✓ Basic' :
                                   '✗ Not Ready'} {site.audit.directoryReadiness.percentage ? `(${site.audit.directoryReadiness.percentage}%)` : ''}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {(site.audit?.success || site.audit?.totalScore) && (
                                  <button
                                    onClick={() => { setSelectedSite(site); setCurrentView('site-detail'); }}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                  >
                                    View
                                  </button>
                                )}
                                <button
                                  onClick={() => runAudit(site.id)}
                                  disabled={isLoading[site.id]}
                                  className={`px-3 py-1 text-sm rounded text-white ${
                                    isLoading[site.id] ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                                  }`}
                                >
                                  {isLoading[site.id] ? '...' : site.audit ? 'Re-Audit' : 'Audit'}
                                </button>
                                <button
                                  onClick={() => deleteSite(site.id)}
                                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}

                {sites.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl">
                    <div className="text-6xl mb-4">🌐</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No sites yet</h3>
                    <p className="text-gray-500">Add a domain above to start auditing</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Sites List View */}
        {currentView === 'sites' && (
          <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">All Sites</h2>
              <button
                onClick={() => { setCurrentView('dashboard'); setShowAddForm(true); }}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                + Add Business
              </button>
            </div>

            {sites.length > 0 ? (
              <div className="grid gap-4">
                {sites.map(site => (
                  <div key={site.id} className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                      {/* Score Circle */}
                      <div className="flex items-center gap-4 md:block">
                        <div className="flex-shrink-0">
                          {(site.audit?.success || site.audit?.totalScore) ? (
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl ${getScoreColor(site.audit.totalScore).class}`}>
                              {site.audit.totalScore}
                            </div>
                          ) : (
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                              N/A
                            </div>
                          )}
                        </div>
                        {/* Mobile: Show name next to score */}
                        <div className="md:hidden flex-1">
                          <div className="font-semibold text-gray-800">
                            {site.businessName || site.domain}
                          </div>
                          {site.businessName && (
                            <div className="text-xs text-gray-500">{site.domain}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Site Info - Desktop */}
                      <div className="hidden md:block flex-1">
                        <div className="font-semibold text-gray-800 text-lg">
                          {site.businessName || site.domain}
                        </div>
                        {site.businessName && (
                          <div className="text-sm text-gray-500">{site.domain}</div>
                        )}
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                          {site.address && (
                            <span>📍 {site.address}</span>
                          )}
                          {site.phone && (
                            <span>📞 {site.phone}</span>
                          )}
                          {site.audit?.platform && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                              {site.audit.platform.name}
                            </span>
                          )}
                          {site.audit?.directoryReadiness && (
                            <span className={
                              site.audit.directoryReadiness.tier === 'featured' ? 'text-emerald-600' :
                              site.audit.directoryReadiness.tier === 'basic' ? 'text-blue-600' :
                              'text-orange-600'
                            }>
                              {site.audit.directoryReadiness.percentage}% Ready
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mobile: Extra info below */}
                      <div className="md:hidden text-sm text-gray-500 space-y-1">
                        {site.address && <div>📍 {site.address}</div>}
                        {site.audit?.platform && (
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                            {site.audit.platform.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Data Confidence Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        site.dataConfidenceSource === 'oauth_verified' ? 'bg-green-100 text-green-700' :
                        site.dataConfidenceSource === 'api_verified' ? 'bg-blue-100 text-blue-700' :
                        site.dataConfidenceSource === 'client_confirmed' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {site.dataConfidenceSource === 'oauth_verified' ? '✅ Verified' :
                         site.dataConfidenceSource === 'api_verified' ? '🔗 API' :
                         site.dataConfidenceSource === 'client_confirmed' ? '👤 Confirmed' :
                         '📡 Detected'}
                      </span>
                      
                      {/* Industry - Hidden on mobile */}
                      <select
                        value={site.industry}
                        onChange={(e) => updateSite(site.id, { industry: e.target.value })}
                        className="hidden md:block px-3 py-2 border rounded-lg text-sm text-gray-700 bg-white"
                      >
                        {Object.entries(INDUSTRY_PRESETS).map(([key, preset]) => (
                          <option key={key} value={key}>{preset.label}</option>
                        ))}
                      </select>
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {(site.audit?.success || site.audit?.totalScore) && (
                          <button
                            onClick={() => { setSelectedSite(site); setCurrentView('site-detail'); }}
                            className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={() => runAudit(site.id)}
                          disabled={isLoading[site.id]}
                          className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-medium text-white text-sm ${
                            isLoading[site.id] ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {isLoading[site.id] ? '⏳...' : site.audit ? '🔄 Audit' : '▶ Audit'}
                        </button>
                        <button
                          onClick={() => deleteSite(site.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <div className="text-6xl mb-4">🌐</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No sites yet</h3>
                <p className="text-gray-500 mb-4">Add a business to start auditing</p>
                <button
                  onClick={() => { setCurrentView('dashboard'); setShowAddForm(true); }}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  + Add Your First Business
                </button>
              </div>
            )}
          </div>
        )}

        {/* Site Detail View */}
        {currentView === 'site-detail' && selectedSite?.audit && (selectedSite.audit.success || selectedSite.audit.totalScore) && (
          <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <button
                  onClick={() => { setCurrentView('sites'); setSelectedSite(null); }}
                  className="text-gray-500 hover:text-gray-700 self-start"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                    {selectedSite.businessName || selectedSite.domain}
                  </h2>
                  {selectedSite.businessName && (
                    <div className="text-sm text-gray-500">{selectedSite.domain}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {selectedSite.audit.platform?.name || 'Unknown'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedSite.dataConfidenceSource === 'oauth_verified' ? 'bg-green-100 text-green-700' :
                    selectedSite.dataConfidenceSource === 'api_verified' ? 'bg-blue-100 text-blue-700' :
                    selectedSite.dataConfidenceSource === 'client_confirmed' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedSite.dataConfidenceSource === 'oauth_verified' ? '✅ Verified' :
                     selectedSite.dataConfidenceSource === 'api_verified' ? '🔗 API' :
                     selectedSite.dataConfidenceSource === 'client_confirmed' ? '👤 Confirmed' :
                     '📡 Detected'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => downloadPDF(selectedSite, selectedSite.audit, branding)}
                  className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  📄 <span className="hidden md:inline">Print</span> Report
                </button>
                <button
                  onClick={() => setShowSprintModal(selectedSite)}
                  className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  🚀 <span className="hidden md:inline">Start</span> Sprint
                </button>
              </div>
            </div>

            {/* Business Info + Map Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              {/* Business Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">📍 Business Information</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Business Name</div>
                    <div className="font-medium text-gray-800">{selectedSite.businessName || <span className="text-gray-400 italic">Not provided</span>}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Address</div>
                    <div className="font-medium text-gray-800">{selectedSite.address || <span className="text-gray-400 italic">Not provided</span>}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Phone</div>
                    <div className="font-medium text-gray-800">{selectedSite.phone || <span className="text-gray-400 italic">Not provided</span>}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Industry</div>
                    <div className="font-medium text-gray-800">
                      {INDUSTRY_PRESETS[selectedSite.industry]?.label || 'Other'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
                {selectedSite.address ? (
                  <iframe
                    title="Business Location"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(selectedSite.address)}`}
                  />
                ) : (
                  <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🗺️</div>
                      <div>Add an address to show map</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Row: Score + Directory Readiness */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Score Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl ${getScoreColor(selectedSite.audit.totalScore).class}`}>
                    {selectedSite.audit.totalScore}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {getScoreColor(selectedSite.audit.totalScore).label}
                    </div>
                    <div className="text-gray-500">Ourgorithm Score</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Audited {selectedSite.audit.auditDate ? new Date(selectedSite.audit.auditDate).toLocaleDateString() : 'recently'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Directory Readiness Card */}
              <div className={`rounded-xl p-6 shadow-sm ${
                selectedSite.audit.directoryReadiness.tier === 'featured' ? 'bg-emerald-50 border-2 border-emerald-200' :
                selectedSite.audit.directoryReadiness.tier === 'basic' ? 'bg-blue-50 border-2 border-blue-200' :
                'bg-orange-50 border-2 border-orange-200'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-800">{DIRECTORY_CONFIG.name} Readiness</h3>
                    <div className={`text-3xl font-bold mt-1 ${
                      selectedSite.audit.directoryReadiness.tier === 'featured' ? 'text-emerald-600' :
                      selectedSite.audit.directoryReadiness.tier === 'basic' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {selectedSite.audit.directoryReadiness.percentage}%
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedSite.audit.directoryReadiness.tier === 'featured' ? 'bg-emerald-500 text-white' :
                    selectedSite.audit.directoryReadiness.tier === 'basic' ? 'bg-blue-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {selectedSite.audit.directoryReadiness.tier === 'featured' ? '⭐ Featured Ready' :
                     selectedSite.audit.directoryReadiness.tier === 'basic' ? '✓ Basic Ready' :
                     '✗ Not Ready'}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="h-3 bg-white rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full transition-all ${
                      selectedSite.audit.directoryReadiness.tier === 'featured' ? 'bg-emerald-500' :
                      selectedSite.audit.directoryReadiness.tier === 'basic' ? 'bg-blue-500' :
                      'bg-orange-500'
                    }`}
                    style={{ width: `${selectedSite.audit.directoryReadiness.percentage}%` }}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  {selectedSite.audit.directoryReadiness.passedCount} of {selectedSite.audit.directoryReadiness.totalCount} requirements met
                </div>
              </div>
            </div>

            {/* Platform Note */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-6 flex items-center gap-4">
              <span className="text-2xl">💻</span>
              <div>
                <div className="font-semibold text-indigo-900">Built with {selectedSite.audit.platform.name}</div>
                <div className="text-sm text-indigo-700">{selectedSite.audit.platform.note}</div>
              </div>
              <div className={`ml-auto px-3 py-1 rounded text-sm font-semibold ${
                selectedSite.audit.platform.canFix === 'full' ? 'bg-green-100 text-green-700' :
                selectedSite.audit.platform.canFix === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {selectedSite.audit.platform.canFix === 'full' ? '✓ Full Control' :
                 selectedSite.audit.platform.canFix === 'partial' ? '~ Partial Control' :
                 '? Unknown'}
              </div>
            </div>

            {/* Categories - Compact Tables */}
            {selectedSite.audit.categories && (
            <div className="space-y-4">
              {Object.entries(selectedSite.audit.categories).map(([key, category]) => (
                <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${getScoreColor((category.score / category.maxScore) * 100).class}`}>
                        {category.score}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-800">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.score}/{category.maxScore} points</div>
                      </div>
                    </div>
                    <span className={`text-gray-400 transition-transform ${expandedCategory === key ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedCategory === key && (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-t">
                        <tr>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-8">Status</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Check</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">What This Means</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fix Time</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Google Timeline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {category.checks.map((check, idx) => (
                          <tr key={idx} className={check.passed ? 'bg-green-50/50' : 'bg-red-50/50'}>
                            <td className="px-6 py-4">
                              <span className={`text-lg ${check.passed ? 'text-green-600' : 'text-red-500'}`}>
                                {check.passed ? '✓' : '✗'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-800">{check.name || check.key}</div>
                              {check.value && <div className="text-xs text-gray-500 mt-0.5">{check.value}</div>}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                              {check.whatItMeans || '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {check.passed ? '—' : check.fixTime || '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {check.passed ? '—' : check.googleTimeline || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
            )}

            {/* Directory Requirements */}
            {selectedSite.audit.directoryReadiness?.requirements && (
            <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-800 mb-4">📋 Directory Requirements Checklist</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedSite.audit.directoryReadiness.requirements.map((req, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${req.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className={`text-lg ${req.passed ? 'text-green-600' : 'text-red-500'}`}>
                      {req.passed ? '✓' : '✗'}
                    </span>
                    <span className={req.passed ? 'text-green-800' : 'text-red-800'}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Message if no full audit data */}
            {!selectedSite.audit.categories && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">🔄</div>
                <h3 className="font-semibold text-yellow-800 mb-1">Limited Audit Data</h3>
                <p className="text-yellow-700 text-sm mb-4">This audit was loaded from history. Run a new audit to see full details.</p>
                <button
                  onClick={() => runAudit(selectedSite.id)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600"
                >
                  🔄 Run Full Audit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {currentView === 'settings' && (
          <div className="p-4 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Settings</h2>
            
            <div className="grid gap-4 md:gap-6 max-w-2xl">
              {/* Branding Settings */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">🎨 Branding</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Directory / Company Name</label>
                    <input
                      type="text"
                      value={branding.companyName}
                      onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
                      placeholder="Your Directory Name"
                    />
                    <p className="text-xs text-gray-500 mt-1">This appears in reports and the Directory Readiness section</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10 border-2 border-gray-200 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 font-mono"
                        placeholder="#1e3a5f"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                    <input
                      type="url"
                      value={branding.logoUrl}
                      onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
                      placeholder="https://yoursite.com/logo.png"
                    />
                    <p className="text-xs text-gray-500 mt-1">Will appear on PDF reports. Use a direct image URL.</p>
                  </div>
                  
                  {branding.logoUrl && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                      <img 
                        src={branding.logoUrl} 
                        alt="Logo preview" 
                        className="max-h-16 object-contain"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Database Status */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">🗄️ Database Status</h3>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-medium text-green-800">Connected to Supabase</div>
                    <div className="text-sm text-green-600">{totalSites} sites stored • Audits auto-saved</div>
                  </div>
                </div>
              </div>

              {/* Report Preview */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4">📄 Report Preview</h3>
                <div 
                  className="p-6 rounded-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, #0f172a)` }}
                >
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo" className="h-8 mb-3 object-contain" />
                  )}
                  <div className="text-xs uppercase tracking-wider opacity-80">Online Presence Report</div>
                  <div className="text-xl font-bold mt-1">example-site.com</div>
                  <div className="text-sm opacity-80 mt-1">Prepared by {branding.companyName}</div>
                </div>
                <p className="text-xs text-gray-500 mt-3">This shows how your PDF report headers will look</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* No Presence Letter Modal */}
      {showNoPresenceLetter && (
        <NoPresenceLetter domain={showNoPresenceLetter} onClose={() => setShowNoPresenceLetter(null)} />
      )}

      {/* Sprint Modal */}
      {showSprintModal && (
        <SprintModal 
          site={showSprintModal} 
          branding={branding}
          onClose={() => setShowSprintModal(null)} 
          onSubmit={async (email, phone) => {
            const readiness = showSprintModal.audit?.directoryReadiness;
            const blockers = readiness?.requirements?.filter(r => !r.passed).map(r => r.label) || [];
            await saveSprintRequestToDB(showSprintModal.id, email, phone, readiness?.tier, blockers, showSprintModal.domain);
            setShowSprintModal(null);
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// SPRINT MODAL COMPONENT
// =====================================================

function SprintModal({ site, branding, onClose, onSubmit }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const readiness = site.audit?.directoryReadiness;
  const blockers = readiness?.requirements?.filter(r => !r.passed) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(email, phone);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center" onClick={e => e.stopPropagation()}>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You're In!</h2>
          <p className="text-gray-600 mb-6">
            We'll reach out within 24 hours to start your Directory-Ready Sprint for {site.domain}.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">🚀 Directory-Ready Sprint</h2>
              <p className="text-blue-100 text-sm mt-1">Get {site.domain} listed in {branding.companyName}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">×</button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Current Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            readiness?.tier === 'featured' ? 'bg-emerald-50 border border-emerald-200' :
            readiness?.tier === 'basic' ? 'bg-blue-50 border border-blue-200' :
            'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">
                {readiness?.tier === 'featured' ? '⭐' : readiness?.tier === 'basic' ? '✓' : '✗'}
              </span>
              <span className="font-bold">
                {readiness?.tier === 'featured' ? 'Featured Ready' : 
                 readiness?.tier === 'basic' ? 'Basic Ready' : 'Not Ready'}
              </span>
              <span className="ml-auto font-bold">{readiness?.percentage || 0}%</span>
            </div>
            {blockers.length > 0 && (
              <div className="text-sm mt-2">
                <span className="font-semibold">To qualify, you need:</span>
                <ul className="mt-1 space-y-1">
                  {blockers.slice(0, 4).map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* What's Included */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">What's Included in the Sprint:</h3>
            <div className="space-y-2">
              {[
                'Full technical SEO fixes',
                'Schema markup implementation',
                'Trust signals setup (privacy policy, contact page)',
                'Google Business Profile optimization',
                'Review generation strategy',
                `${branding.companyName} listing setup`,
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-emerald-500">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          {/* Contact Form */}
          <form onSubmit={handleSubmit}>
            <h3 className="font-bold text-gray-800 mb-3">Start Your Sprint:</h3>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number (optional)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 font-bold rounded-lg transition-opacity ${
                  isSubmitting ? 'bg-gray-400 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90'
                }`}
              >
                {isSubmitting ? '⏳ Submitting...' : '🚀 Start My Sprint'}
              </button>
            </div>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            We'll reach out within 24 hours to discuss your sprint plan.
          </p>
        </div>
      </div>
    </div>
  );
}
  


