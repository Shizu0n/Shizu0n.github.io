import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Language = 'en' | 'pt'

type TranslationFunction = (
  key: string,
  params?: Record<string, string | number>,
) => string

interface TranslationContextType {
  t: TranslationFunction
  language: Language
  toggleLanguage: () => void
}

const translations = {
  en: {
    // Nav
    'nav.about': 'About',
    'nav.skills': 'Skills',
    'nav.projects': 'Projects',
    'nav.contact': 'Contact',
    
    // Chat Widget
    'chat.askMe': 'Ask me',
    'chat.subtitle': 'Ask me about my work',
    'chat.emptyMsg': 'Ask me anything about my work, experience, or projects.',
    'chat.placeholder': 'Message...',
    'chat.error': 'Failed to send message. Try again later.',
    'chat.quotaExceeded': 'API rate limit reached. Try again in {seconds}s.',

    // Hero
    'hero.kicker': 'Paulo Shizuo',
    'hero.meta': 'Full stack developer / Fortaleza, Brazil',
    'hero.caption': 'Editorial systems for products, code, and motion.',
    'hero.title.one': 'Calm',
    'hero.title.two': 'interfaces.',
    'hero.title.three': 'Precise software.',
    'hero.overlay.left': 'Act 01',
    'hero.overlay.left.desc': 'Scroll-linked pacing, restrained contrast, and one visual plane doing the heavy lifting.',
    'hero.overlay.right': 'Parallax',
    'hero.overlay.right.desc': 'Type, motion, and hierarchy moving in lockstep with the page instead of competing for attention.',
    'hero.outro': 'Entering selected work',
    'hero.outro.desc': 'Curated case studies, product thinking, and front-end direction built to feel production ready.',
    'hero.hint': 'Scroll to enter the story',
    
    // About
    'about.kicker': 'Act 02 / Credentials',
    'about.title': 'A developer focused on clean systems, measured motion, and product-ready delivery.',
    'about.body': 'Computer Science student with hands-on experience building interfaces, APIs, and polished front-end work that balances clarity with atmosphere.',
    'about.stats.repos': 'Public repos',
    'about.stats.stars': 'Stars earned',
    'about.stats.started': 'Started coding',
    'about.stats.followers': 'GitHub followers',
    'about.proof.base': 'Current base',
    'about.proof.base.val': 'Fortaleza, Brazil',
    'about.proof.stack': 'Most used stack',
    'about.proof.style': 'Working style',
    'about.proof.style.val': 'Minimal interfaces, strong hierarchy, dependable implementation.',
    'about.note.one': 'Building across front-end surfaces and backend rules.',
    'about.note.two': 'Editorial restraint with enough motion to feel alive.',

    // Skills
    'skills.kicker': 'Act 03 / Capabilities',
    'skills.title': 'Design restraint, motion discipline, and full-stack execution working as one system.',
    'skills.body': 'Each layer has a single job: guide the eye, support the story, and keep the interface feeling deliberate instead of busy.',

    // Projects
    'projects.kicker': 'Act 04 / Selected work',
    'projects.title': 'A curated showcase designed to read like a portfolio, not a repository dump.',
    'projects.body': 'Four projects, each presented for its product thinking, technical structure, and the visual clarity behind how it is experienced.',
    'projects.archive.msg': 'For the live repository archive and ongoing experiments, visit GitHub.',
    'projects.archive.link': 'Open full GitHub archive \u2192',

    // Contact
    'contact.kicker': 'Act 05 / Contact',
    'contact.title': "If the brief needs clarity, polish, and working code, let's talk.",
    'contact.body': 'Available for internships, freelance collaborations, and product-minded builds that need both design restraint and implementation depth.',
    'contact.form.name': 'Name',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.send': 'Send message',
    'contact.form.sending': 'Sending...',
  },
  pt: {
    // Nav
    'nav.about': 'Sobre',
    'nav.skills': 'Habilidades',
    'nav.projects': 'Projetos',
    'nav.contact': 'Contato',

    // Chat Widget
    'chat.askMe': 'Pergunte',
    'chat.subtitle': 'Pergunte sobre meu trabalho',
    'chat.emptyMsg': 'Pergunte qualquer coisa sobre meu trabalho, experiência ou projetos.',
    'chat.placeholder': 'Mensagem...',
    'chat.error': 'Falha ao enviar mensagem. Tente novamente mais tarde.',
    'chat.quotaExceeded': 'Limite da API atingido. Tente em {seconds}s.',

    // Hero
    'hero.kicker': 'Paulo Shizuo',
    'hero.meta': 'Desenvolvedor Full Stack / Fortaleza, Brasil',
    'hero.caption': 'Sistemas editoriais para produtos, código e movimento.',
    'hero.title.one': 'Interfaces',
    'hero.title.two': 'calmas.',
    'hero.title.three': 'Software preciso.',
    'hero.overlay.left': 'Ato 01',
    'hero.overlay.left.desc': 'Ritmo guiado por scroll, contraste contido e um único plano visual fazendo o trabalho pesado.',
    'hero.overlay.right': 'Parallax',
    'hero.overlay.right.desc': 'Tipografia, movimento e hierarquia coreografados com a página sem competir por atenção.',
    'hero.outro': 'Entrando no trabalho selecionado',
    'hero.outro.desc': 'Estudos de caso curados, mentalidade de produto e direção de front-end pronta para produção.',
    'hero.hint': 'Faça scroll para entrar na história',

    // About
    'about.kicker': 'Ato 02 / Credenciais',
    'about.title': 'Um desenvolvedor focado em sistemas limpos, movimento comedido e entregas de qualidade.',
    'about.body': 'Estudante de Ciência da Computação com experiência prática criando interfaces, APIs e aplicações polidas, equilibrando clareza e imersão.',
    'about.stats.repos': 'Repositórios públicos',
    'about.stats.stars': 'Estrelas recebidas',
    'about.stats.started': 'Começou a codar',
    'about.stats.followers': 'Seguidores no GitHub',
    'about.proof.base': 'Base atual',
    'about.proof.base.val': 'Fortaleza, Brasil',
    'about.proof.stack': 'Stack principal',
    'about.proof.style': 'Estilo de trabalho',
    'about.proof.style.val': 'Interfaces minimalistas, hierarquia forte e implementação confiável.',
    'about.note.one': 'Construindo através de regras de backend e superfícies front-end.',
    'about.note.two': 'Restrição editorial com movimento suficiente para parecer vivo.',

    // Skills
    'skills.kicker': 'Ato 03 / Capacidades',
    'skills.title': 'Restrição de design, disciplina no movimento e execução full-stack em harmonia.',
    'skills.body': 'Cada camada tem um único trabalho: guiar o olhar, ajudar a contar a história e manter a interface intencional em vez de poluída.',

    // Projects
    'projects.kicker': 'Ato 04 / Trabalhos selecionados',
    'projects.title': 'Uma vitrine curada para ser lida como portfólio, não como um despejo de código.',
    'projects.body': 'Quatro projetos, cada um selecionado pelo pensamento de produto, estrutura técnica e clareza visual de como é experienciado.',
    'projects.archive.msg': 'Para o arquivo remoto de repositórios e projetos paralelos, acesse o GitHub.',
    'projects.archive.link': 'Abrir arquivo completo do GitHub \u2192',

    // Contact
    'contact.kicker': 'Ato 05 / Contato',
    'contact.title': 'Se o seu desafio exige clareza, polimento e código que funciona, vamos conversar.',
    'contact.body': 'Disponível para estágios, parcerias freelas e desenvolvimentos com foco em produto que necessitem restrição de design e profundidade.',
    'contact.form.name': 'Nome',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Assunto',
    'contact.form.message': 'Mensagem',
    'contact.form.send': 'Enviar mensagem',
    'contact.form.sending': 'Enviando...',
  }
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en')

  // Load persisted language on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('shizu0n_lang') as Language
      if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
        setLanguage(savedLang)
      } else {
        // Auto-detect based on navigator
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith('pt')) {
          setLanguage('pt')
        }
      }
    } catch (e) {
      // Ignorar erros do localStorage
    }
  }, [])

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'pt' : 'en'
      try {
        localStorage.setItem('shizu0n_lang', newLang)
      } catch (e) {
        // Ignorar
      }
      return newLang
    })
  }

  const t: TranslationFunction = (key, params) => {
    const dict = translations[language] || translations['en']
    const text = dict[key as keyof typeof dict] || key

    if (!params) {
      return text
    }

    return Object.entries(params).reduce(
      (result, [paramKey, value]) => result.replace(`{${paramKey}}`, String(value)),
      text,
    )
  }

  return (
    <TranslationContext.Provider value={{ t, language, toggleLanguage }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext)

  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }

  return context
}
