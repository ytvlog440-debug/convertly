import { useQuery } from '@tanstack/react-query'
import { fetchHealth, type HealthData } from '../lib/api'

export function useHealth() {
  return useQuery<HealthData, Error>({
    queryKey: ['system-health'],
    queryFn: fetchHealth,
    refetchInterval: 30000, // Check every 30s
    retry: 1,
    staleTime: 10000,
  })
}
