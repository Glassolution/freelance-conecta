import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Home, Globe, Briefcase,
  CheckCircle, Send, PackageCheck, Wrench,
  Settings, LogOut, Search, Bell, Mail,
  Clock, ExternalLink, RefreshCw, Filter,
  ArrowUpDown, Users, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const sidebarLinks = [
  { icon: Home, label: 'Início', active: false, path: '/dashboard' },
  { icon: ShoppingBag, label: 'Marketplace', active: true, path: '/marketplace' },
  { icon: Globe, label: 'Criador.ia', active: false, path: null },
  { icon: CheckCircle, label: 'Serviços Aprovados', active: false, path: null },
  { icon: Send, label: 'Serviços Enviados', active: false, path: null },
  { icon: PackageCheck, label: 'Serviços Entregues', active: false, path: null },
  { icon: Wrench, label: 'Ferramentas', active: false, path: '/ferramentas' },
];

function getUserInitials(user: any): string {
  const name = user?.user_metadata?.full_name;
  if (name) return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  return (user?.email?.[0] || 'U').toUpperCase();
}

function getUserDisplayName(user: any): string {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
}

// --- Unified job type ---

interface UnifiedJob {
  id: string;
  title: string;
  description: string;
  url: string;
  budgetDisplay: string;
  budgetOriginal: string;
  budgetSortValue: number;
  bidsCount: number;
  skills: { name: string; id?: number }[];
  platform: 'Freelancer' | 'Workana' | '99Freelas';
  platformColor: string;
  timeLabel: string;
  timestamp: number;
}

// --- Freelancer types ---

interface FreelancerJob {
  id: number;
  title: string;
  seo_url: string;
  preview_description: string;
  submitdate: number;
  budget: {
    minimum: number;
    maximum: number;
    currency_id: number;
  };
  currency: {
    code: string;
    sign: string;
  };
  bid_stats: {
    bid_count: number;
  };
  time_submitted: number;
  time_updated: number;
  jobs: { name: string; id: number }[];
  type: string;
}

// --- Workana types ---

interface WorkanaJob {
  title: string;
  description: string;
  skills: string[];
  budget: string;
  bids: number;
  pubDate: string;
  platform: 'Workana';
  platformColor: string;
  url: string;
}

// --- 99Freelas types ---

interface Freelas99Job {
  title: string;
  description: string;
  skills: string[];
  budget: string;
  bids: number;
  pubDate: string;
  platform: '99Freelas';
  platformColor: string;
  url: string;
}

// --- Filter config ---

type FilterTab = 'all' | 'dev' | 'mobile' | 'marketing' | 'video' | 'design';
type SortOption = 'newest' | 'budget_desc' | 'bids_asc';

const SKILL_KEYWORDS: Record<FilterTab, string[]> = {
  all: [],
  dev: ['php', 'javascript', 'react', 'node', 'html', 'css', 'python', 'java', 'typescript', 'angular', 'vue', 'laravel', 'wordpress', 'woocommerce', 'mysql', 'mongodb', 'api', 'backend', 'frontend', 'fullstack', 'full-stack', 'full stack', 'web', 'programação', 'programming', 'developer', 'hubspot', '.net', 'ruby', 'django', 'flask', 'html5'],
  mobile: ['android', 'ios', 'react native', 'flutter', 'swift', 'kotlin', 'mobile', 'app'],
  marketing: ['marketing', 'seo', 'social media', 'facebook', 'instagram', 'google ads', 'advertising', 'mídia', 'tráfego', 'traffic', 'performance', 'branding', 'copywriting', 'whatsapp'],
  video: ['video', 'after effects', 'premiere', 'capcut', 'animação', 'animation', 'motion', 'edição', 'editing', 'davinci', 'runway', 'audiovisual', '3d'],
  design: ['design', 'figma', 'ui', 'ux', 'logo', 'graphic', 'illustrator', 'photoshop', 'branding', 'identidade visual', 'visual identity', 'web design'],
};

const filterTabs: { key: FilterTab; label: string; jobIds: number[] }[] = [
  { key: 'all', label: 'Todos', jobIds: [] },
  { key: 'dev', label: 'Dev & Programação', jobIds: [3, 2, 17, 59, 119, 7, 12, 106, 29, 116, 125, 51, 146, 132] },
  { key: 'mobile', label: 'Apps Mobile', jobIds: [9, 671, 267, 255, 741, 1107, 1330] },
  { key: 'marketing', label: 'Marketing', jobIds: [162, 104, 153, 52, 55, 75, 329, 512, 358, 540] },
  { key: 'video', label: 'Edição de Vídeo', jobIds: [582, 620, 584, 666, 1006] },
  { key: 'design', label: 'Design', jobIds: [13, 14, 15, 20, 30, 40, 16, 99, 21, 242, 377, 1168] },
];

const ALLOWED_SKILL_IDS = new Set(
  filterTabs.filter(t => t.key !== 'all').flatMap(t => t.jobIds)
);

// --- Time helpers ---

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function parseWorkanaTimeToTimestamp(pubDate: string): number {
  const now = Math.floor(Date.now() / 1000);
  if (!pubDate || pubDate === 'Agora') return now;
  const minuteMatch = pubDate.match(/(\d+)\s*min/);
  if (minuteMatch) return now - parseInt(minuteMatch[1]) * 60;
  const hourMatch = pubDate.match(/(\d+)\s*hora/);
  if (hourMatch) return now - parseInt(hourMatch[1]) * 3600;
  const dayMatch = pubDate.match(/(\d+)\s*dia/);
  if (dayMatch) return now - parseInt(dayMatch[1]) * 86400;
  return now - 300; // default: 5 min ago
}

// --- Budget helpers ---

const EXCHANGE_RATES: Record<string, number> = {
  USD: 5.70, INR: 0.068, EUR: 6.20,
  GBP: 7.20, AUD: 3.60, CAD: 4.10, BRL: 1.0,
};

function convertToBRL(amount: number, currencyCode: string): number {
  const rate = EXCHANGE_RATES[currencyCode] || 5.70;
  return Math.round(amount * rate);
}

function formatFreelancerBudget(budget: FreelancerJob['budget'], currency?: FreelancerJob['currency']): { brl: string; original: string; sortValue: number } {
  const code = currency?.code || 'USD';
  const sign = currency?.sign || '$';

  const minBRL = convertToBRL(budget.minimum, code);
  const maxBRL = convertToBRL(budget.maximum, code);

  let brl: string;
  if (budget.minimum === budget.maximum) {
    brl = `R$ ${minBRL.toLocaleString('pt-BR')}`;
  } else {
    brl = `R$ ${minBRL.toLocaleString('pt-BR')} - R$ ${maxBRL.toLocaleString('pt-BR')}`;
  }

  let original = '';
  if (code !== 'BRL') {
    if (budget.minimum === budget.maximum) {
      original = `(${code} ${sign}${budget.minimum.toLocaleString()})`;
    } else {
      original = `(${code} ${sign}${budget.minimum.toLocaleString()} - ${sign}${budget.maximum.toLocaleString()})`;
    }
  }

  return { brl, original, sortValue: maxBRL };
}

function parseWorkanaBudgetSortValue(budgetText: string): number {
  const nums = budgetText.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 0;
  return parseFloat(nums[nums.length - 1].replace(/\./g, ''));
}

// --- Workana scraping + fallback ---

const WORKANA_URLS = [
  'https://www.workana.com/jobs?category=it-programming&language=pt',
  'https://www.workana.com/jobs?category=design-multimedia&language=pt',
  'https://www.workana.com/jobs?category=sales-marketing&language=pt',
  'https://www.workana.com/jobs?category=design-multimedia&skills=video-editing&language=pt',
];

function parseWorkananBudget(budgetText: string): string {
  if (!budgetText) return 'A combinar';
  const rate = 5.70;

  if (budgetText.includes('Less than') || budgetText.includes('Menos de')) {
    const val = budgetText.match(/[\d,]+/)?.[0];
    return val ? `Até R$ ${Math.round(+val.replace(/,/g, '') * rate).toLocaleString('pt-BR')}` : 'A combinar';
  }
  if ((budgetText.includes('Over') || budgetText.includes('Mais de')) && (budgetText.includes('hour') || budgetText.includes('hora'))) {
    const val = budgetText.match(/[\d,]+/)?.[0];
    return val ? `Acima de R$ ${Math.round(+val.replace(/,/g, '') * rate).toLocaleString('pt-BR')}/hr` : 'A combinar';
  }
  if (budgetText.includes('hour') || budgetText.includes('hora')) {
    const vals = budgetText.match(/[\d,]+/g);
    if (vals && vals.length >= 2)
      return `R$ ${Math.round(+vals[0].replace(/,/g, '') * rate).toLocaleString('pt-BR')} - R$ ${Math.round(+vals[1].replace(/,/g, '') * rate).toLocaleString('pt-BR')}/hr`;
  }

  // Already in BRL (R$)?
  if (budgetText.includes('R$')) return budgetText;

  const vals = budgetText.match(/[\d,]+/g);
  if (vals && vals.length >= 2)
    return `R$ ${Math.round(+vals[0].replace(/,/g, '') * rate).toLocaleString('pt-BR')} - R$ ${Math.round(+vals[1].replace(/,/g, '') * rate).toLocaleString('pt-BR')}`;
  if (vals && vals.length === 1)
    return `R$ ${Math.round(+vals[0].replace(/,/g, '') * rate).toLocaleString('pt-BR')}`;

  return 'A combinar';
}

async function fetchWorkanaJobs(): Promise<WorkanaJob[]> {
  const allJobs: WorkanaJob[] = [];

  for (const url of WORKANA_URLS) {
    try {
      const proxy = 'https://api.allorigins.win/get?url=';
      const res = await fetch(proxy + encodeURIComponent(url));
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.contents) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      const jobLinks = doc.querySelectorAll('h2 a[href*="/job/"]');

      jobLinks.forEach((jobEl) => {
        const card = jobEl.closest('li') || jobEl.closest('.project') || jobEl.parentElement?.parentElement;
        const title = jobEl.textContent?.trim() || '';
        const href = jobEl.getAttribute('href') || '';
        const description = card?.querySelector('p')?.textContent?.trim() || '';
        const rawBudget = card?.querySelector('[class*="budget"], [class*="price"]')?.textContent?.trim() || '';
        const bidsText = card?.querySelector('[class*="bid"]')?.textContent?.match(/\d+/)?.[0] || '0';
        const pubDate = card?.querySelector('[class*="date"], [class*="time"]')?.textContent?.trim() || 'Agora';
        const skillEls = card?.querySelectorAll('a[href*="skills"]') || [];
        const skills = Array.from(skillEls).slice(0, 4).map(s => s.textContent?.trim() || '').filter(Boolean);

        if (title) {
          allJobs.push({
            title,
            description,
            skills,
            budget: rawBudget ? parseWorkananBudget(rawBudget) : 'A combinar',
            bids: parseInt(bidsText) || 0,
            pubDate,
            platform: 'Workana',
            platformColor: '#0077b5',
            url: href.startsWith('http') ? href : `https://www.workana.com${href}`,
          });
        }
      });
    } catch {
      // continue to next URL
    }
  }

  return allJobs;
}

const WORKANA_FALLBACK: WorkanaJob[] = [
  {
    title: "Designer/Desenvolvedor Hubspot para 22 Landing Pages de Alta Conversão",
    description: "Desenvolvedor HubSpot para criar 22 Landing Pages de alta conversão para SaaS focado em bares e restaurantes.",
    skills: ["Hubspot", "HTML", "CSS", "JavaScript"],
    budget: "R$ 2.850 - R$ 5.700",
    bids: 6,
    pubDate: "39 minutos atrás",
    platform: "Workana",
    platformColor: "#0077b5",
    url: "https://www.workana.com/job/designer-desenvolvedor-hubspot-para-22-landing-pages-de-alta-conversao"
  },
  {
    title: "Editor de Vídeos com Expertise em After Effects e Premiere para Canal Dark",
    description: "Editor para canal dark de review de produtos. Conhecimento intermediário a avançado em After Effects e Premiere.",
    skills: ["Adobe After Effects", "Adobe Premiere", "Video Editing"],
    budget: "Até R$ 285",
    bids: 1,
    pubDate: "1 hora atrás",
    platform: "Workana",
    platformColor: "#0077b5",
    url: "https://www.workana.com/job/editor-de-videos-com-expertise-em-after-effects-e-premiere-para-canal-dark"
  },
  {
    title: "Reconstrução Completa de E-commerce com Integração Bling e Segurança Avançada",
    description: "Reconstruir e-commerce do zero com plugins modernos, mantendo funcionalidades críticas. Integração com Bling.",
    skills: ["PHP", "MySQL", "WordPress", "WooCommerce"],
    budget: "R$ 1.425 - R$ 2.850",
    bids: 0,
    pubDate: "Agora",
    platform: "Workana",
    platformColor: "#0077b5",
    url: "https://www.workana.com/job/reconstrucao-completa-de-e-commerce-com-integracao-bling-e-seguranca-avancada"
  },
  {
    title: "Vaga: Social Media Manager (Foco em Performance e Comprometimento)",
    description: "Agência de marketing busca Social Media Manager para gestão de redes sociais de clientes com foco em resultados.",
    skills: ["Social Media Marketing", "Marketing Strategy", "Advertising"],
    budget: "R$ 85 - R$ 256/hr",
    bids: 0,
    pubDate: "Agora",
    platform: "Workana",
    platformColor: "#0077b5",
    url: "https://www.workana.com/job/vaga-social-media-manager-foco-em-performance-e-comprometimento"
  },
  {
    title: "Criação de Vídeo Promocional para Aplicativo de Educação Financeira",
    description: "Vídeo de divulgação para app de educação financeira focado em estudantes de medicina.",
    skills: ["Video Production", "Motion Graphics", "Adobe Premiere"],
    budget: "R$ 285 - R$ 570",
    bids: 0,
    pubDate: "5 minutos atrás",
    platform: "Workana",
    platformColor: "#0077b5",
    url: "https://www.workana.com/job/criacao-de-video-promocional-para-aplicativo-de-educacao-financeira"
  },
  {
    title: "Animador 2D com Expertise em IA para Piloto de Desenho Animado Infantil",
    description: "Animador 2D para produzir piloto de desenho animado infantil de 3-5 minutos. Estilo similar à Galinha Pintadinha.",
    skills: ["Animation", "Illustration", "Video Production"],
    budget: "R$ 570 - R$ 1.425",
    bids: 0,
    pubDate: "Agora",
    platform: "Workana",
    platformColor: "#0077b5",
    url: "https://www.workana.com/job/animador-2d-com-expertise-em-ia-para-piloto-de-desenho-animado-infantil"
  },
];

// --- 99Freelas scraping + fallback ---

const FREELAS99_URLS = [
  'https://www.99freelas.com.br/projects?category=web-mobile-software',
  'https://www.99freelas.com.br/projects?category=design-criacao',
  'https://www.99freelas.com.br/projects?category=vendas-marketing',
  'https://www.99freelas.com.br/projects?category=fotografia-audiovisual',
];

async function fetch99FreelasJobs(): Promise<Freelas99Job[]> {
  const allJobs: Freelas99Job[] = [];

  for (const url of FREELAS99_URLS) {
    try {
      const proxy = 'https://api.allorigins.win/get?url=';
      const res = await fetch(proxy + encodeURIComponent(url));
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.contents) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      const items = doc.querySelectorAll('h1 a[href*="/project/"]');

      items.forEach((jobEl) => {
        const card = jobEl.closest('li') || jobEl.closest('.project-item') || jobEl.parentElement?.parentElement;
        const title = jobEl.textContent?.trim() || '';
        const href = jobEl.getAttribute('href') || '';
        const fullText = card?.textContent || '';
        const description = card?.querySelector('p, .description')?.textContent?.trim()?.slice(0, 150) || '';
        const propostas = fullText.match(/Propostas:\s*(\d+)/)?.[1] || '0';
        const pubDate = fullText.match(/Publicado:\s*([^|]+)/)?.[1]?.trim() || 'Agora';
        const skillEls = card?.querySelectorAll('a[href*="/projects?q="]') || [];
        const skills = Array.from(skillEls).slice(0, 4).map(s => s.textContent?.trim() || '').filter(Boolean);

        if (title) {
          allJobs.push({
            title,
            description,
            skills,
            budget: 'A combinar',
            bids: parseInt(propostas) || 0,
            pubDate,
            platform: '99Freelas',
            platformColor: '#0077b5',
            url: href.startsWith('http') ? href : `https://www.99freelas.com.br${href}`,
          });
        }
      });
    } catch {
      // continue to next URL
    }
  }

  return allJobs;
}

const FREELAS99_FALLBACK: Freelas99Job[] = [
  {
    title: "Melhorar layout e design do site WordPress",
    description: "Melhorar o visual da página: ajustar cores, organizar layout, criar banner rotativo e deixar o site mais moderno.",
    skills: ["Web Design", "WordPress"],
    budget: "A combinar",
    bids: 23,
    pubDate: "3 horas atrás",
    platform: "99Freelas",
    platformColor: "#0a7aff",
    url: "https://www.99freelas.com.br/project/melhorar-layout-e-design-do-site-wordpress-735737"
  },
  {
    title: "Especialista em Edição de Vídeo com IA para Produção de Criativos de Ads",
    description: "Edição de vídeo com IA para produzir 16-20 vídeos/dia para campanhas de geração de leads em múltiplos formatos.",
    skills: ["CapCut", "Premiere", "After Effects", "Runway"],
    budget: "A combinar",
    bids: 1,
    pubDate: "17 minutos atrás",
    platform: "99Freelas",
    platformColor: "#0a7aff",
    url: "https://www.99freelas.com.br/project/especialista-em-edicao-de-video-com-ia-para-producao-de-criativos-de-ads-em-735789"
  },
  {
    title: "Desenvolvimento de site para equipe de motocross",
    description: "Desenvolver front-end, back-end, integração com loja e deploy na Hostinger. Layout já pronto no Figma.",
    skills: ["CSS", "HTML5", "JavaScript", "React"],
    budget: "A combinar",
    bids: 15,
    pubDate: "38 minutos atrás",
    platform: "99Freelas",
    platformColor: "#0a7aff",
    url: "https://www.99freelas.com.br/project/desenvolvimento-de-site-para-equipe-de-motocross-735786"
  },
  {
    title: "Automação de atendimento WhatsApp e gestão de aluguéis de kitnets",
    description: "Automatizar atendimento via WhatsApp com Typebot, integração Evolution API e gestão financeira com boletos/PIX.",
    skills: ["WhatsApp API", "Typebot", "Automação"],
    budget: "A combinar",
    bids: 5,
    pubDate: "43 minutos atrás",
    platform: "99Freelas",
    platformColor: "#0a7aff",
    url: "https://www.99freelas.com.br/project/automacao-de-atendimento-whatsapp-e-gestao-de-alugueis-de-kitnets-735783"
  },
  {
    title: "Branding e criação de perfis sem rosto para Instagram e TikTok",
    description: "Criar e estruturar página profissional no Instagram e TikTok com identidade visual, feed inicial e estratégia de conteúdo.",
    skills: ["Social Media", "Branding", "Instagram"],
    budget: "A combinar",
    bids: 3,
    pubDate: "59 minutos atrás",
    platform: "99Freelas",
    platformColor: "#0a7aff",
    url: "https://www.99freelas.com.br/project/branding-e-criacao-de-perfis-sem-rosto-para-instagram-e-tiktok-735776"
  },
  {
    title: "Vídeo institucional com animação 3D",
    description: "Vídeo institucional de 3 minutos com animação 3D sobre saneamento básico. Formatos: YouTube e Reels.",
    skills: ["Animação 3D", "Video Production"],
    budget: "A combinar",
    bids: 2,
    pubDate: "1 hora atrás",
    platform: "99Freelas",
    platformColor: "#0a7aff",
    url: "https://www.99freelas.com.br/project/video-institucional-com-animacao-3d-735778"
  },
];

// --- Converters to UnifiedJob ---

function freelancerToUnified(job: FreelancerJob, tr?: { title?: string; description?: string }): UnifiedJob {
  const budget = job.budget
    ? formatFreelancerBudget(job.budget, job.currency)
    : { brl: 'A definir', original: '', sortValue: 0 };

  return {
    id: `fl-${job.id}`,
    title: tr?.title || job.title,
    description: tr?.description || job.preview_description || '',
    url: `https://www.freelancer.com/projects/${job.seo_url}`,
    budgetDisplay: budget.brl,
    budgetOriginal: budget.original,
    budgetSortValue: budget.sortValue,
    bidsCount: job.bid_stats?.bid_count || 0,
    skills: (job.jobs || []).map(j => ({ name: j.name, id: j.id })),
    platform: 'Freelancer',
    platformColor: '#0077b5',
    timeLabel: timeAgo(job.time_submitted || job.submitdate),
    timestamp: job.time_submitted || job.submitdate || 0,
  };
}

function workanaToUnified(job: WorkanaJob, index: number): UnifiedJob {
  return {
    id: `wk-${index}-${job.title.slice(0, 20).replace(/\s/g, '')}`,
    title: job.title,
    description: job.description,
    url: job.url,
    budgetDisplay: job.budget,
    budgetOriginal: '',
    budgetSortValue: parseWorkanaBudgetSortValue(job.budget),
    bidsCount: job.bids,
    skills: job.skills.map(s => ({ name: s })),
    platform: 'Workana',
    platformColor: '#0077b5',
    timeLabel: job.pubDate,
    timestamp: parseWorkanaTimeToTimestamp(job.pubDate),
  };
}

function freelas99ToUnified(job: Freelas99Job, index: number): UnifiedJob {
  return {
    id: `99f-${index}-${job.title.slice(0, 20).replace(/\s/g, '')}`,
    title: job.title,
    description: job.description,
    url: job.url,
    budgetDisplay: job.budget,
    budgetOriginal: '',
    budgetSortValue: 0,
    bidsCount: job.bids,
    skills: job.skills.map(s => ({ name: s })),
    platform: '99Freelas',
    platformColor: '#0a7aff',
    timeLabel: job.pubDate,
    timestamp: parseWorkanaTimeToTimestamp(job.pubDate),
  };
}

// --- Translation ---

async function translateToPT(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  try {
    const encoded = encodeURIComponent(text.slice(0, 500));
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|pt-br`
    );
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (!translated || translated.toUpperCase() === translated) {
      return text;
    }
    return translated;
  } catch {
    return text;
  }
}

function getTranslationCache(jobId: number, field: string): string | null {
  try {
    return localStorage.getItem(`tr_${jobId}_${field}`);
  } catch {
    return null;
  }
}

function setTranslationCache(jobId: number, field: string, value: string): void {
  try {
    localStorage.setItem(`tr_${jobId}_${field}`, value);
  } catch {
    // ignore
  }
}

interface TranslatedTexts {
  [jobId: number]: { title?: string; description?: string };
}

// ========================
// COMPONENT
// ========================

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  // Freelancer state
  const [freelancerJobs, setFreelancerJobs] = useState<FreelancerJob[]>([]);
  const [freelancerLoading, setFreelancerLoading] = useState(true);
  const [freelancerError, setFreelancerError] = useState<string | null>(null);

  // Workana state
  const [workanaJobs, setWorkanaJobs] = useState<WorkanaJob[]>([]);
  const [workanaLoading, setWorkanaLoading] = useState(true);
  const [workanaUsedFallback, setWorkanaUsedFallback] = useState(false);

  // 99Freelas state
  const [freelas99Jobs, setFreelas99Jobs] = useState<Freelas99Job[]>([]);
  const [freelas99Loading, setFreelas99Loading] = useState(true);
  const [freelas99UsedFallback, setFreelas99UsedFallback] = useState(false);

  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [translations, setTranslations] = useState<TranslatedTexts>({});
  const [translating, setTranslating] = useState(false);
  const translationAbort = useRef<AbortController | null>(null);

  // Fetch Workana jobs
  const fetchWorkanaJobsData = useCallback(async () => {
    setWorkanaLoading(true);
    setWorkanaUsedFallback(false);
    
    try {
      const jobs = await fetchWorkanaJobs();
      if (jobs.length === 0) {
        // Use fallback if scraping returns no jobs
        setWorkanaJobs(WORKANA_FALLBACK);
        setWorkanaUsedFallback(true);
      } else {
        setWorkanaJobs(jobs);
        setWorkanaUsedFallback(false);
      }
    } catch (error) {
      console.error('Error fetching Workana jobs:', error);
      // Use fallback on error
      setWorkanaJobs(WORKANA_FALLBACK);
      setWorkanaUsedFallback(true);
    } finally {
      setWorkanaLoading(false);
    }
  }, []);

  // Fetch 99Freelas jobs
  const fetch99FreelasJobsData = useCallback(async () => {
    setFreelas99Loading(true);
    setFreelas99UsedFallback(false);
    
    try {
      const jobs = await fetch99FreelasJobs();
      if (jobs.length === 0) {
        setFreelas99Jobs(FREELAS99_FALLBACK);
        setFreelas99UsedFallback(true);
      } else {
        setFreelas99Jobs(jobs);
        setFreelas99UsedFallback(false);
      }
    } catch (error) {
      console.error('Error fetching 99Freelas jobs:', error);
      setFreelas99Jobs(FREELAS99_FALLBACK);
      setFreelas99UsedFallback(true);
    } finally {
      setFreelas99Loading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setFreelancerLoading(true);
    setFreelancerError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('freelancer-jobs', {
        body: { limit: 50, offset: 0 },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch');

      const projects = data.data?.projects || [];
      setFreelancerJobs(projects);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setFreelancerError(err.message);
    } finally {
      setFreelancerLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchWorkanaJobsData();
    fetch99FreelasJobsData();
    const interval = setInterval(() => {
      fetchJobs(true);
      fetchWorkanaJobsData();
      fetch99FreelasJobsData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchJobs, fetchWorkanaJobsData, fetch99FreelasJobsData]);

  // Translate jobs when they load
  useEffect(() => {
    if (freelancerJobs.length === 0) return;

    // Abort any in-flight translation batch
    translationAbort.current?.abort();
    const controller = new AbortController();
    translationAbort.current = controller;

    const translateAll = async () => {
      setTranslating(true);

      // Preload cached translations immediately
      const cached: TranslatedTexts = {};
      const toTranslate: { jobId: number; field: 'title' | 'description'; text: string }[] = [];

      for (const job of freelancerJobs) {
        const cachedTitle = getTranslationCache(job.id, 'title');
        const cachedDesc = getTranslationCache(job.id, 'desc');

        cached[job.id] = {
          title: cachedTitle || undefined,
          description: cachedDesc || undefined,
        };

        if (!cachedTitle && job.title) {
          toTranslate.push({ jobId: job.id, field: 'title', text: job.title });
        }
        if (!cachedDesc && job.preview_description) {
          toTranslate.push({ jobId: job.id, field: 'description', text: job.preview_description.slice(0, 500) });
        }
      }

      // Show cached results immediately
      setTranslations({ ...cached });

      if (toTranslate.length === 0) {
        setTranslating(false);
        return;
      }

      // Translate in small batches (3 at a time) to respect API rate limits
      const BATCH_SIZE = 3;
      const updated = { ...cached };

      for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
        if (controller.signal.aborted) return;

        const batch = toTranslate.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (item) => {
            const translated = await translateToPT(item.text);
            return { ...item, translated };
          })
        );

        for (const r of results) {
          if (!updated[r.jobId]) updated[r.jobId] = {};
          if (r.field === 'title') {
            updated[r.jobId].title = r.translated;
            setTranslationCache(r.jobId, 'title', r.translated);
          } else {
            updated[r.jobId].description = r.translated;
            setTranslationCache(r.jobId, 'desc', r.translated);
          }
        }

        if (!controller.signal.aborted) {
          setTranslations({ ...updated });
        }
      }

      if (!controller.signal.aborted) {
        setTranslating(false);
      }
    };

    translateAll();

    return () => {
      controller.abort();
    };
  }, [freelancerJobs]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Combine and filter all jobs
  const allJobsMerged = useMemo(() => {
    const freelancerUnified = freelancerJobs.map(job => freelancerToUnified(job, translations[job.id]));
    const workanaUnified = workanaJobs.map((job, index) => workanaToUnified(job, index));
    const freelas99Unified = freelas99Jobs.map((job, index) => freelas99ToUnified(job, index));
    
    return [...freelancerUnified, ...workanaUnified, ...freelas99Unified];
  }, [freelancerJobs, workanaJobs, freelas99Jobs, translations]);

  const filteredJobs = useMemo(() => {
    let result = allJobsMerged;

    // Filter by tab
    if (activeFilter !== 'all') {
      const keywords = SKILL_KEYWORDS[activeFilter];
      const tab = filterTabs.find(t => t.key === activeFilter);
      
      result = result.filter(job => {
        if (job.platform === 'Freelancer' && tab) {
          const freelancerJob = freelancerJobs.find(fj => fj.id === parseInt(job.id.replace('fl-', '')));
          return freelancerJob?.jobs?.some(j => tab.jobIds.includes(j.id));
        } else if ((job.platform === 'Workana' || job.platform === '99Freelas') && keywords.length > 0) {
          const searchText = `${job.title} ${job.description} ${job.skills.map(s => s.name).join(' ')}`.toLowerCase();
          return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
        }
        return true;
      });
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j => {
        const searchText = `${j.title} ${j.description} ${j.skills.map(s => s.name).join(' ')}`.toLowerCase();
        return searchText.includes(q);
      });
    }

    // Sort
    if (sortBy === 'budget_desc') {
      result.sort((a, b) => b.budgetSortValue - a.budgetSortValue);
    } else if (sortBy === 'bids_asc') {
      result.sort((a, b) => a.bidsCount - b.bidsCount);
    } else {
      result.sort((a, b) => b.timestamp - a.timestamp);
    }

    return result;
  }, [allJobsMerged, activeFilter, searchQuery, sortBy, freelancerJobs]);

  const isLoading = freelancerLoading || workanaLoading || freelas99Loading;
  const hasError = freelancerError && !workanaUsedFallback && !freelas99UsedFallback;
  const totalJobs = freelancerJobs.length + workanaJobs.length + freelas99Jobs.length;
  
  const lastRefreshLabel = lastRefresh
    ? `Atualizado ${lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <div className="flex h-screen" style={{ background: '#F8F9FC' }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[240px] shrink-0 flex flex-col justify-between py-6 px-4 max-lg:hidden border-r border-[#E8ECF4]" style={{ background: '#ffffff' }}>
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: '#2563eb' }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-[#111111] leading-tight">{displayName}</p>
              <p className="text-[11px] font-body text-[#9CA3B4]">Marketplace Global</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => link.path && navigate(link.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-colors ${
                  link.active ? 'text-[#2563eb]' : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6]'
                }`}
                style={link.active ? { background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' } : undefined}
              >
                <link.icon size={18} />
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-[#6B7280] hover:text-[#111111] hover:bg-[#f3f4f6] transition-colors">
            <Settings size={18} /> Configurações
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOP BAR */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-[#E8ECF4] shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="flex items-center gap-2 bg-[#F3F4F8] rounded-full px-4 py-2 flex-1">
              <Search size={16} className="text-[#9CA3B4]" />
              <input
                type="text"
                placeholder="Buscar vagas no marketplace..."
                className="bg-transparent text-sm font-body text-[#1A1D26] outline-none flex-1 placeholder:text-[#9CA3B4]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastRefreshLabel && (
              <span className="text-[11px] font-body text-[#9CA3B4] flex items-center gap-1.5 max-md:hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {lastRefreshLabel}
              </span>
            )}
            <button
              onClick={() => fetchJobs(true)}
              disabled={refreshing}
              className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D26] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="w-9 h-9 rounded-full bg-[#F3F4F8] flex items-center justify-center text-[#6B7280] hover:text-[#1A1D26] transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#2563eb' }}>
                {initials}
              </div>
              <span className="text-sm font-body font-medium text-[#1A1D26] max-md:hidden">{displayName}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden p-8" style={{ background: 'linear-gradient(135deg, #0077b5, #00a6ff)', minHeight: '160px' }}>
              <div className="relative z-10 max-w-lg">
                <p className="text-xs font-body font-medium text-white/70 uppercase tracking-wider mb-1">Marketplace Global</p>
                <p className="font-heading font-extrabold text-2xl md:text-3xl text-white leading-tight mb-2">
                  Vagas em Tempo Real do Freelancer.com + Workana + 99Freelas
                </p>
                <p className="text-sm font-body text-white/80 mb-3">
                  Encontre projetos internacionais e nacionais atualizados automaticamente
                </p>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 backdrop-blur text-white text-sm font-body font-medium px-4 py-2 rounded-full">
                    {totalJobs} vagas disponíveis
                  </span>
                  {translating && (
                    <span className="bg-white/10 backdrop-blur text-white/80 text-xs font-body px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                      Traduzindo...
                    </span>
                  )}
                  {lastRefreshLabel && (
                    <span className="bg-white/10 backdrop-blur text-white/80 text-xs font-body px-3 py-1.5 rounded-full">
                      {lastRefreshLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-15 bg-white max-md:hidden" />
            </div>

            {/* Filter Tabs + Sort */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all ${
                      activeFilter === tab.key
                        ? 'text-white shadow-md'
                        : 'text-[#6B7280] bg-white border border-[#E8ECF4] hover:border-[#0077b5]/30 hover:text-[#0077b5]'
                    }`}
                    style={activeFilter === tab.key ? { background: '#0077b5' } : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-[#9CA3B4]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm font-body font-medium text-[#6B7280] bg-transparent outline-none cursor-pointer border border-[#E8ECF4] rounded-lg px-3 py-1.5 hover:border-[#0077b5]/30 transition-colors"
                >
                  <option value="newest">Mais recentes</option>
                  <option value="budget_desc">Maior orçamento</option>
                  <option value="bids_asc">Menos propostas</option>
                </select>
              </div>
            </div>

            {/* Error State */}
            {hasError && !isLoading && (
              <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                  <Globe size={24} className="text-amber-500" />
                </div>
                <p className="font-heading font-bold text-lg text-[#1A1D26] mb-2">Não foi possível carregar as vagas</p>
                <p className="font-body text-sm text-[#9CA3B4] mb-5 max-w-md mx-auto">
                  Configure a chave de API do Freelancer.com nas configurações para carregar vagas em tempo real.
                </p>
                <button
                  onClick={() => fetchJobs()}
                  className="text-sm font-body font-semibold px-6 py-2.5 rounded-full text-white transition-all hover:brightness-110"
                  style={{ background: '#0077b5' }}
                >
                  Tentar novamente
                </button>
                {/* Skeleton placeholders */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-[#F8F9FC] rounded-2xl p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-xl mt-3" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E8ECF4] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-11 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {/* Jobs Grid */}
            {!isLoading && !hasError && (
              <>
                {workanaUsedFallback && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <p className="text-xs font-body text-amber-700">
                      ⚠️ Exibindo últimas vagas salvas da Workana (serviço temporariamente indisponível)
                    </p>
                  </div>
                )}
                {freelas99UsedFallback && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                    <p className="text-xs font-body text-blue-700">
                      ⚠️ Exibindo últimas vagas salvas do 99Freelas
                    </p>
                  </div>
                )}
                <p className="text-sm font-body text-[#9CA3B4]">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                </p>

                {filteredJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8ECF4] p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F3F4F8] flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-[#9CA3B4]" />
                    </div>
                    <p className="font-heading font-bold text-lg text-[#1A1D26] mb-1">Nenhuma vaga encontrada</p>
                    <p className="font-body text-sm text-[#9CA3B4]">
                      Tente ajustar os filtros ou buscar por outro termo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-2xl border border-[#E8ECF4] overflow-hidden group hover:scale-[1.01] transition-all duration-300 hover:shadow-lg hover:border-[#0077b5]/20 flex flex-col"
                      >
                        <div className="p-5 flex flex-col flex-1">
                          {/* Header: platform + time */}
                          <div className="flex items-center justify-between mb-3">
                            <span 
                              className="text-[10px] font-body font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white" 
                              style={{ background: job.platformColor }}
                            >
                              {job.platform}
                            </span>
                            <span className="text-[11px] font-body text-[#9CA3B4] flex items-center gap-1">
                              <Clock size={11} />
                              {job.timeLabel}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-heading font-bold text-[15px] text-[#1A1D26] leading-snug mb-2 line-clamp-2">
                            {job.title}
                          </h4>

                          {/* Description */}
                          <p className="text-xs font-body text-[#9CA3B4] mb-3 line-clamp-3 flex-1">
                            {job.description.slice(0, 120)}
                            {job.description.length > 120 ? '...' : ''}
                          </p>

                          {/* Skills */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {job.skills.slice(0, 4).map((skill, index) => (
                                <span
                                  key={index}
                                  className="text-[10px] font-body font-medium px-2 py-0.5 rounded-md bg-[#F3F4F8] text-[#6B7280]"
                                >
                                  {skill.name}
                                </span>
                              ))}
                              {job.skills.length > 4 && (
                                <span className="text-[10px] font-body text-[#9CA3B4]">
                                  +{job.skills.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Divider */}
                          <div className="border-t border-[#E8ECF4] pt-3 mt-auto">
                            {/* Budget + Bids */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-[10px] font-body text-[#9CA3B4] uppercase tracking-wider mb-0.5">Orçamento</p>
                                <p className="text-lg font-heading font-extrabold" style={{ color: job.platformColor }}>
                                  {job.budgetDisplay}
                                </p>
                                {job.budgetOriginal && (
                                  <p className="text-[10px] font-body text-[#9CA3B4] mt-0.5">{job.budgetOriginal}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-[#9CA3B4]">
                                  <Users size={12} />
                                  <span className="text-xs font-body font-medium">
                                    {job.bidsCount} proposta{job.bidsCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* CTA */}
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <button 
                                className="w-full py-3 rounded-xl text-sm font-body font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                                style={{ background: job.platformColor }}
                              >
                                <ExternalLink size={14} />
                                Ver Vaga na {job.platform}
                              </button>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
