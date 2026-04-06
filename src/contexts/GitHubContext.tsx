import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Tipos para dados do GitHub
export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubStats {
  totalStars: number;
  totalForks: number;
  totalRepos: number;
  followers: number;
  following: number;
  topLanguages: { name: string; count: number }[];
  recentActivity: GitHubRepo[];
}

interface GitHubContextType {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  stats: GitHubStats | null;
  loading: boolean;
  error: string | null;
  getRepoByName: (name: string) => GitHubRepo | undefined;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

const GITHUB_USERNAME = 'Shizu0n';
const CACHE_KEY = 'github_data_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface CachedData {
  user: GitHubUser;
  repos: GitHubRepo[];
  timestamp: number;
}

export const GitHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (userData: GitHubUser, reposData: GitHubRepo[]): GitHubStats => {
    const totalStars = reposData.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    const totalForks = reposData.reduce((acc, repo) => acc + repo.forks_count, 0);
    
    // Calcular linguagens mais usadas
    const languageCount: Record<string, number> = {};
    reposData.forEach(repo => {
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
    });
    
    const topLanguages = Object.entries(languageCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Repos mais recentes (ordenados por última atualização)
    const recentActivity = [...reposData]
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      .slice(0, 5);

    return {
      totalStars,
      totalForks,
      totalRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      topLanguages,
      recentActivity,
    };
  };

  const fetchGitHubData = useCallback(async () => {
    // Verificar cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data: CachedData = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          setUser(data.user);
          setRepos(data.repos);
          setStats(calculateStats(data.user, data.repos));
          setLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user data
      const userResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
      if (!userResponse.ok) {
        throw new Error('Falha ao carregar dados do usuário');
      }
      const userData: GitHubUser = await userResponse.json();

      // Fetch repos
      const reposResponse = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
      );
      if (!reposResponse.ok) {
        throw new Error('Falha ao carregar repositórios');
      }
      const reposData: GitHubRepo[] = await reposResponse.json();

      // Filtrar repos não-fork e públicos
      const filteredRepos = reposData.filter(repo => !repo.name.startsWith('.'));

      setUser(userData);
      setRepos(filteredRepos);
      setStats(calculateStats(userData, filteredRepos));

      // Salvar no cache
      const cacheData: CachedData = {
        user: userData,
        repos: filteredRepos,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do GitHub');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRepoByName = (name: string): GitHubRepo | undefined => {
    return repos.find(repo => 
      repo.name.toLowerCase() === name.toLowerCase() ||
      repo.name.toLowerCase().replace(/-/g, '') === name.toLowerCase().replace(/-/g, ''),
    );
  };

  useEffect(() => {
    fetchGitHubData();
  }, [fetchGitHubData]);

  return (
    <GitHubContext.Provider value={{ user, repos, stats, loading, error, getRepoByName }}>
      {children}
    </GitHubContext.Provider>
  );
};

export const useGitHub = (): GitHubContextType => {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return context;
};
