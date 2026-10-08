import React from 'react';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Compass } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  phaseScheduled: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  phaseScheduled,
  description,
}) => {
  return (
    <div className="space-y-6">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        badge={
          <Badge variant="outline" size="sm">
            {phaseScheduled}
          </Badge>
        }
      />

      <EmptyState
        icon={<Compass size={28} className="text-primary" />}
        title={`${title} Module`}
        description={`${description} This dedicated intelligence surface is mapped in the system architecture and scheduled for implementation.`}
      />
    </div>
  );
};
