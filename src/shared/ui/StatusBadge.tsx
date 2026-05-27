import { Badge } from './Badge';
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  SEND_JOB_STATUS_LABEL,
  type CampaignStatus,
  type SendJobStatus,
} from '../constants/status';

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge tone={CAMPAIGN_STATUS_TONE[status]} dot>
      {CAMPAIGN_STATUS_LABEL[status]}
    </Badge>
  );
}

const SEND_JOB_TONE: Record<SendJobStatus, 'success' | 'warn' | 'danger' | 'scheduled' | 'neutral'> = {
  REQUESTED: 'scheduled',
  QUEUED: 'scheduled',
  SENDING: 'warn',
  SUCCESS: 'success',
  FAILED: 'danger',
  RETRYING: 'warn',
  CANCELLED: 'neutral',
};

export function SendStatusBadge({ status }: { status: SendJobStatus }) {
  return (
    <Badge tone={SEND_JOB_TONE[status]} dot>
      {SEND_JOB_STATUS_LABEL[status]}
    </Badge>
  );
}
