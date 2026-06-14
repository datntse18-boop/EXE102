export const mockUsers = [
  { id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'member' },
  { id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'leader' },
]

export const mockOpportunities = Array.from({ length: 8 }).map((_, i) => ({
  id: `opp-${i+1}`,
  title: `Opportunity ${i+1}`,
  category: ['Education','Technology','Healthcare'][i % 3],
  summary: 'Mock opportunity description',
}))
