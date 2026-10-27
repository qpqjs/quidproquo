import { aws_logs } from 'aws-cdk-lib';

export const SUPPORTED_RETENTION_DAYS: aws_logs.RetentionDays[] = [
  aws_logs.RetentionDays.ONE_DAY,
  aws_logs.RetentionDays.THREE_DAYS,
  aws_logs.RetentionDays.FIVE_DAYS,
  aws_logs.RetentionDays.ONE_WEEK,
  aws_logs.RetentionDays.TWO_WEEKS,
  aws_logs.RetentionDays.ONE_MONTH,
  aws_logs.RetentionDays.TWO_MONTHS,
  aws_logs.RetentionDays.THREE_MONTHS,
  aws_logs.RetentionDays.FOUR_MONTHS,
  aws_logs.RetentionDays.FIVE_MONTHS,
  aws_logs.RetentionDays.SIX_MONTHS,
  aws_logs.RetentionDays.ONE_YEAR,
  aws_logs.RetentionDays.THIRTEEN_MONTHS,
  aws_logs.RetentionDays.EIGHTEEN_MONTHS,
  aws_logs.RetentionDays.TWO_YEARS,
  aws_logs.RetentionDays.FIVE_YEARS,
  aws_logs.RetentionDays.TEN_YEARS,
];

// Rounds a config-supplied day count UP to the nearest CloudWatch-supported
// retention value (beyond the largest supported value caps at ten years).
export const resolveLogRetention = (days?: number): aws_logs.RetentionDays => {
  if (!days) return aws_logs.RetentionDays.ONE_MONTH;
  return SUPPORTED_RETENTION_DAYS.find((v) => v >= days) ?? aws_logs.RetentionDays.TEN_YEARS;
};
