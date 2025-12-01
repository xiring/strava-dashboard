// Internationalization utility

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh';

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Locale, Translations> = {
  en: {
    dashboard: 'Dashboard',
    activities: 'Activities',
    statistics: 'Statistics',
    records: 'Records',
    goals: 'Goals',
    settings: 'Settings',
    logout: 'Logout',
    // Add more translations as needed
  },
  es: {
    dashboard: 'Panel',
    activities: 'Actividades',
    statistics: 'Estadísticas',
    records: 'Récords',
    goals: 'Objetivos',
    settings: 'Configuración',
    logout: 'Cerrar sesión',
  },
  fr: {
    dashboard: 'Tableau de bord',
    activities: 'Activités',
    statistics: 'Statistiques',
    records: 'Records',
    goals: 'Objectifs',
    settings: 'Paramètres',
    logout: 'Déconnexion',
  },
  de: {
    dashboard: 'Dashboard',
    activities: 'Aktivitäten',
    statistics: 'Statistiken',
    records: 'Rekorde',
    goals: 'Ziele',
    settings: 'Einstellungen',
    logout: 'Abmelden',
  },
  it: {
    dashboard: 'Cruscotto',
    activities: 'Attività',
    statistics: 'Statistiche',
    records: 'Record',
    goals: 'Obiettivi',
    settings: 'Impostazioni',
    logout: 'Disconnetti',
  },
  pt: {
    dashboard: 'Painel',
    activities: 'Atividades',
    statistics: 'Estatísticas',
    records: 'Recordes',
    goals: 'Metas',
    settings: 'Configurações',
    logout: 'Sair',
  },
  ja: {
    dashboard: 'ダッシュボード',
    activities: 'アクティビティ',
    statistics: '統計',
    records: '記録',
    goals: '目標',
    settings: '設定',
    logout: 'ログアウト',
  },
  zh: {
    dashboard: '仪表板',
    activities: '活动',
    statistics: '统计',
    records: '记录',
    goals: '目标',
    settings: '设置',
    logout: '登出',
  },
};

export function getTranslation(key: string, locale: Locale = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations.en;

  for (const k of keys) {
    value = value?.[k];
    if (!value) {
      // Fallback to English
      value = translations.en;
      for (const k2 of keys) {
        value = value?.[k2];
      }
      break;
    }
  }

  return typeof value === 'string' ? value : key;
}

export function formatDate(date: Date, locale: Locale = 'en'): string {
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale);
}

export function formatDistance(meters: number, locale: Locale = 'en', useImperial: boolean = false): string {
  if (useImperial) {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  }
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

