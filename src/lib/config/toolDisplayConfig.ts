export const TOOL_DISPLAY_CONFIG: Record<string, { icon: string; label: string; description: string }> = {
  // Statistics Tools
  'get_programme_statistics': { icon: '📊', label: 'Programme Stats', description: 'Getting success rates and funding data' },
  'get_country_statistics': { icon: '🌍', label: 'Country Stats', description: 'Getting participation statistics' },

  // Comparison Tools
  'compare_programmes': { icon: '⚖️', label: 'Compare', description: 'Comparing programmes side-by-side' },

  // Document Tools
  'search_documents': { icon: '📄', label: 'Documents', description: 'Searching EU documents' },

  // Call Tools
  'search_funding_calls': { icon: '📢', label: 'Funding Calls', description: 'Finding open funding opportunities' },
  'get_call_details': { icon: '🔍', label: 'Call Details', description: 'Getting detailed call information' },

  // Project Tools
  'search_projects': { icon: '🔬', label: 'Projects', description: 'Searching funded projects' },
  'get_project_details': { icon: '📋', label: 'Project Details', description: 'Getting project information' },
  'find_similar_projects': { icon: '🔗', label: 'Similar Projects', description: 'Finding related projects' },
  'find_semantically_similar_projects': { icon: '🧠', label: 'AI Similar', description: 'Finding semantically similar projects' },
  'find_organization_projects': { icon: '🏢', label: 'Org Projects', description: 'Finding organization\'s projects' },
  'get_collaboration_network': { icon: '🤝', label: 'Network', description: 'Mapping collaboration patterns' },
  'search_by_cluster': { icon: '🎯', label: 'Cluster Search', description: 'Searching by research cluster' },

  // Proposal Support Tools
  'get_budget_benchmark': { icon: '💰', label: 'Budget Benchmark', description: 'Getting budget statistics' },
  'get_consortium_patterns': { icon: '👥', label: 'Consortium', description: 'Analyzing consortium patterns' },
  'find_experienced_partners': { icon: '🎓', label: 'Partners', description: 'Finding experienced partners' },
  'get_similar_funded_projects': { icon: '✅', label: 'Funded Similar', description: 'Finding similar funded projects' },
  'analyze_call_history': { icon: '📈', label: 'History', description: 'Analyzing funding history' },

  // NEW: Proposal Planning Tools
  'calculate_budget': { icon: '🧮', label: 'Budget Calculator', description: 'Calculating budget breakdown' },
  'generate_timeline': { icon: '📅', label: 'Timeline', description: 'Generating project timeline' },
};
