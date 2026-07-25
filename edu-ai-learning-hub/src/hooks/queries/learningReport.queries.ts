import { useQuery } from '@tanstack/react-query';
import { fetchLearningReport, LearningReportData } from '@/services/learningReport.service';

export const learningReportKeys = {
  all: ['learningReport'] as const,
  report: () => [...learningReportKeys.all, 'report'] as const,
};

export const useLearningReport = () => {
  return useQuery<LearningReportData, Error>({
    queryKey: learningReportKeys.report(),
    queryFn: fetchLearningReport,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
